package com.btec.crm.controller;

import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/network")
@CrossOrigin(origins = "*")
public class NetworkSimulatorController {

    // Simulyatsiya parametrlari (Xotirada saqlanadi, real-time o'zgaradi)
    private final Map<String, Object> state = new ConcurrentHashMap<>();
    private final List<String> logs = new ArrayList<>();
    private final Random random = new Random();

    public NetworkSimulatorController() {
        resetState();
    }

    private void resetState() {
        state.clear();
        state.put("activeInstances", 1); // Boshlang'ich 1 ta VM
        state.put("cpuUsage", 12.0); // 12% CPU
        state.put("requestRate", 0); // Soniyadagi so'rovlar soni
        state.put("latency", 15); // 15ms latency
        state.put("vpnStatus", "CONNECTED"); // Bosh ofis bilan shifrlangan tunnel statusi
        state.put("packetLoss", 0.0); // 0% paket yo'qolishi
        state.put("activeServers", new ArrayList<>(List.of("CRM-Instance-1")));

        logs.clear();
        logs.add("[" + java.time.LocalTime.now() + "] Tizim ishga tushirildi. 1-Virtual Instance (CRM-Instance-1) faol.");
        logs.add("[" + java.time.LocalTime.now() + "] VPC tarmog'i sozlangan: CIDR block 10.0.0.0/16.");
        logs.add("[" + java.time.LocalTime.now() + "] Load Balancer 80-portda so'rovlarni qabul qilmoqda.");
        logs.add("[" + java.time.LocalTime.now() + "] VPN Tunnel (Bosh ofis <-> AWS Cloud) o'rnatildi.");
    }

    // 1. STATUSNI OLISH (GET /api/network/status)
    @GetMapping("/status")
    public Map<String, Object> getNetworkStatus() {
        // CPU, Latency va boshqa ko'rsatkichlarga bir oz tasodifiy dynamic tebranish beramiz (realistik ko'rinish uchun)
        double currentCpu = (double) state.get("cpuUsage");
        int instances = (int) state.get("activeInstances");
        int reqRate = (int) state.get("requestRate");

        if (reqRate == 0) {
            currentCpu = Math.max(5.0, currentCpu + (random.nextDouble() * 4 - 2)); // 5%-15% oralig'ida tebranish
            state.put("latency", random.nextInt(6) + 12); // 12-18ms
        } else {
            // Yuklama holati
            state.put("latency", random.nextInt(15) + 20 + (reqRate / 10)); // Yuklama oshganda latency ham oshadi
        }

        // Agar yuklama kam bo'lsa va serverlar soni 1 dan ko'p bo'lsa, sekin-sekin "Scale down" qilamiz
        if (reqRate < 50 && instances > 1 && currentCpu < 30) {
            currentCpu = currentCpu - 15;
            state.put("activeInstances", instances - 1);
            @SuppressWarnings("unchecked")
            List<String> servers = (List<String>) state.get("activeServers");
            String removed = servers.remove(servers.size() - 1);
            logs.add("[" + java.time.LocalTime.now() + "] Auto-Scaling: Yuklama kamayganligi sababli " + removed + " o'chirildi (Scale Down).");
        }

        // Limitlar
        currentCpu = Math.min(100.0, Math.max(0.0, currentCpu));
        state.put("cpuUsage", Math.round(currentCpu * 10.0) / 10.0);

        Map<String, Object> response = new HashMap<>(state);
        response.put("logs", new ArrayList<>(logs));
        return response;
    }

    // 2. YUKLAMA YUBORISH / STRESS TEST (POST /api/network/load)
    @PostMapping("/load")
    public Map<String, Object> simulateLoad(@RequestBody Map<String, Integer> payload) {
        int additionalRequests = payload.getOrDefault("requests", 100); // Nechta so'rov

        int currentReqRate = (int) state.get("requestRate") + additionalRequests;
        state.put("requestRate", currentReqRate);

        int instances = (int) state.get("activeInstances");
        double cpuIncrease = (double) additionalRequests * 0.15 / instances; // Har bir serverga tushadigan yuklama
        double currentCpu = (double) state.get("cpuUsage") + cpuIncrease;

        // Auto-scaling sharti: Agar CPU 75% dan oshsa va serverlar soni 4 tadan kam bo'lsa, yangi server qo'shamiz!
        if (currentCpu > 75.0 && instances < 4) {
            instances++;
            state.put("activeInstances", instances);
            @SuppressWarnings("unchecked")
            List<String> servers = (List<String>) state.get("activeServers");
            String newServerName = "CRM-Instance-" + instances;
            servers.add(newServerName);

            logs.add("[" + java.time.LocalTime.now() + "] Auto-Scaling Trigger: CPU yuklamasi " + Math.round(currentCpu) + "% ga yetdi. " + newServerName + " ishga tushirilmoqda (Scale Up)!");

            // Yangi server qo'shilgach, yuklama taqsimlanib CPU biroz pasayadi
            currentCpu = currentCpu * (instances - 1) / instances;
        }

        currentCpu = Math.min(100.0, currentCpu);
        state.put("cpuUsage", Math.round(currentCpu * 10.0) / 10.0);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("cpuUsage", state.get("cpuUsage"));
        response.put("activeInstances", state.get("activeInstances"));
        response.put("activeServers", state.get("activeServers"));
        return response;
    }

    // 3. YUKLAMANI TO'XTATISH / KESHNI TOZALASH (POST /api/network/reset)
    @PostMapping("/reset")
    public Map<String, String> resetSimulator() {
        resetState();
        Map<String, String> response = new HashMap<>();
        response.put("status", "RESET");
        return response;
    }

    // 4. PERIODIK SO'ROV RATESINI TOZALAB TURISH (POST /api/network/decay)
    @PostMapping("/decay")
    public Map<String, Object> decayRequestRate() {
        int reqRate = (int) state.get("requestRate");
        if (reqRate > 0) {
            reqRate = (int) (reqRate * 0.6); // So'rovlar sonini har 2 soniyada 40% ga kamaytiramiz (avtomatik tinchlanish)
            if (reqRate < 5) reqRate = 0;
            state.put("requestRate", reqRate);
        }

        double currentCpu = (double) state.get("cpuUsage");
        int instances = (int) state.get("activeInstances");
        if (reqRate == 0) {
            // CPU ham asta sekin normal holatga (10-15% ga) qaytadi
            double targetCpu = 10.0 + random.nextDouble() * 5;
            currentCpu = currentCpu + (targetCpu - currentCpu) * 0.3;
        } else {
            // CPU ham so'rovlar soniga qarab mos ravishda kamayadi
            double targetCpu = 10.0 + (reqRate * 0.15 / instances);
            currentCpu = currentCpu + (targetCpu - currentCpu) * 0.3;
        }

        state.put("cpuUsage", Math.round(currentCpu * 10.0) / 10.0);

        Map<String, Object> response = new HashMap<>();
        response.put("requestRate", state.get("requestRate"));
        response.put("cpuUsage", state.get("cpuUsage"));
        return response;
    }
}
