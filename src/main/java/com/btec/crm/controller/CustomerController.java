package com.btec.crm.controller;

import com.btec.crm.model.Customer;
import com.btec.crm.model.Interaction;
import com.btec.crm.model.User;
import com.btec.crm.repository.CustomerRepository;
import com.btec.crm.repository.InteractionRepository;
import com.btec.crm.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "*")
public class CustomerController {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final InteractionRepository interactionRepository;

    @Autowired
    public CustomerController(CustomerRepository customerRepository, 
                              UserRepository userRepository, 
                              InteractionRepository interactionRepository) {
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.interactionRepository = interactionRepository;
    }

    // Security check helper
    private User checkAuth(HttpSession session) {
        return (User) session.getAttribute("currentUser");
    }

    // ===================================================================
    // CUSTOMER CRUD OPERATIONS
    // ===================================================================

    // 1. GET ALL CUSTOMERS OR SEARCH
    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers(@RequestParam(required = false) String search, HttpSession session) {
        User currentUser = checkAuth(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Customer> list;
        if (search != null && !search.trim().isEmpty()) {
            list = customerRepository.findByNameContainingIgnoreCaseOrCompanyContainingIgnoreCase(search, search);
        } else {
            list = customerRepository.findAll();
        }
        return ResponseEntity.ok(list);
    }

    // 2. GET SINGLE CUSTOMER BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id, HttpSession session) {
        User currentUser = checkAuth(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<Customer> customer = customerRepository.findById(id);
        return customer.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // 3. CREATE NEW CUSTOMER
    @PostMapping
    public ResponseEntity<Customer> createCustomer(@RequestBody Customer customer, HttpSession session) {
        User currentUser = checkAuth(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        // CEO faqat ko'ra oladi (Read-Only)
        if ("CEO".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            // Xodim biriktirish logikasi
            if (customer.getAssignedTo() != null && customer.getAssignedTo().getId() != null) {
                Optional<User> staff = userRepository.findById(customer.getAssignedTo().getId());
                staff.ifPresent(customer::setAssignedTo);
            } else {
                customer.setAssignedTo(currentUser); // Default hozirgi foydalanuvchiga biriktirish
            }
            
            Customer savedCustomer = customerRepository.save(customer);
            
            // Avtomatik muloqot logi yozish
            interactionRepository.save(new Interaction(
                savedCustomer, 
                currentUser, 
                "Tizim", 
                "Mijoz tizimga birinchi marta qo'shildi va " + currentUser.getFullName() + " biriktirildi."
            ));

            return ResponseEntity.status(HttpStatus.CREATED).body(savedCustomer);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    // 4. UPDATE CUSTOMER
    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @RequestBody Customer customerDetails, HttpSession session) {
        User currentUser = checkAuth(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        // CEO faqat ko'ra oladi (Read-Only)
        if ("CEO".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Customer> optionalCustomer = customerRepository.findById(id);
        if (optionalCustomer.isPresent()) {
            Customer existingCustomer = optionalCustomer.get();
            
            // Eski statusni solishtiramiz
            String oldStatus = existingCustomer.getStatus();
            
            existingCustomer.setName(customerDetails.getName());
            existingCustomer.setCompany(customerDetails.getCompany());
            existingCustomer.setEmail(customerDetails.getEmail());
            existingCustomer.setPhone(customerDetails.getPhone());
            existingCustomer.setStatus(customerDetails.getStatus());
            existingCustomer.setNotes(customerDetails.getNotes());
            
            // Kelishuv summasi va buyurtmalar sonini yangilash
            if (customerDetails.getDealValue() != null) {
                existingCustomer.setDealValue(customerDetails.getDealValue());
            }
            if (customerDetails.getOrderCount() != null) {
                existingCustomer.setOrderCount(customerDetails.getOrderCount());
            }
            
            // Xodim biriktirishni yangilash
            if (customerDetails.getAssignedTo() != null && customerDetails.getAssignedTo().getId() != null) {
                Optional<User> staff = userRepository.findById(customerDetails.getAssignedTo().getId());
                staff.ifPresent(existingCustomer::setAssignedTo);
            }
            
            Customer updatedCustomer = customerRepository.save(existingCustomer);
            
            // Agar status o'zgargan bo'lsa, avtomatik interaction log yozish
            if (!oldStatus.equalsIgnoreCase(customerDetails.getStatus())) {
                interactionRepository.save(new Interaction(
                    updatedCustomer,
                    currentUser,
                    "Status",
                    "Mijoz statusi '" + oldStatus + "' dan '" + customerDetails.getStatus() + "' ga o'zgartirildi."
                ));
            }

            return ResponseEntity.ok(updatedCustomer);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // 5. DELETE CUSTOMER
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteCustomer(@PathVariable Long id, HttpSession session) {
        User currentUser = checkAuth(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        // CEO faqat ko'ra oladi (Read-Only)
        if ("CEO".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Customer> optionalCustomer = customerRepository.findById(id);
        if (optionalCustomer.isPresent()) {
            // Avval muloqotlar tarixini o'chirish
            List<Interaction> interactions = interactionRepository.findByCustomerIdOrderByCreatedAtDesc(id);
            interactionRepository.deleteAll(interactions);
            
            customerRepository.delete(optionalCustomer.get());
            Map<String, Boolean> response = new HashMap<>();
            response.put("deleted", Boolean.TRUE);
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // ===================================================================
    // INTERACTION / ACTIVITY LOG OPERATIONS
    // ===================================================================

    // 6. GET CUSTOMER INTERACTIONS (GET /api/customers/{id}/interactions)
    @GetMapping("/{id}/interactions")
    public ResponseEntity<List<Interaction>> getCustomerInteractions(@PathVariable Long id, HttpSession session) {
        User currentUser = checkAuth(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Interaction> list = interactionRepository.findByCustomerIdOrderByCreatedAtDesc(id);
        return ResponseEntity.ok(list);
    }

    // 7. ADD NEW INTERACTION (POST /api/customers/{id}/interactions)
    @PostMapping("/{id}/interactions")
    public ResponseEntity<Interaction> addInteraction(@PathVariable Long id, @RequestBody Map<String, String> body, HttpSession session) {
        User currentUser = checkAuth(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        // CEO faqat ko'ra oladi (Read-Only)
        if ("CEO".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Customer> optionalCustomer = customerRepository.findById(id);
        if (optionalCustomer.isPresent()) {
            String type = body.get("type");
            String notes = body.get("notes");
            
            if (type == null || notes == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            Interaction interaction = new Interaction(optionalCustomer.get(), currentUser, type, notes);
            Interaction saved = interactionRepository.save(interaction);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    // ===================================================================
    // CEO BUSINESS ANALYTICS & STATS (GET /api/customers/stats)
    // ===================================================================
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCrmStats(HttpSession session) {
        User currentUser = checkAuth(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Customer> allCustomers = customerRepository.findAll();
        List<Interaction> allInteractions = interactionRepository.findAllByOrderByCreatedAtDesc();

        long total = allCustomers.size();
        long leads = allCustomers.stream().filter(c -> "Lead".equalsIgnoreCase(c.getStatus())).count();
        long contacted = allCustomers.stream().filter(c -> "Contacted".equalsIgnoreCase(c.getStatus())).count();
        long proposal = allCustomers.stream().filter(c -> "Proposal".equalsIgnoreCase(c.getStatus())).count();
        long active = allCustomers.stream().filter(c -> "Active".equalsIgnoreCase(c.getStatus())).count();
        long inactive = allCustomers.stream().filter(c -> "Inactive".equalsIgnoreCase(c.getStatus())).count();

        // 1. Umumiy daromad va buyurtmalar soni
        double totalRevenue = allCustomers.stream()
                .mapToDouble(c -> c.getDealValue() != null ? c.getDealValue() : 0.0)
                .sum();
        long totalOrders = allCustomers.stream()
                .mapToLong(c -> c.getOrderCount() != null ? c.getOrderCount() : 0)
                .sum();

        // 2. Xodimlar bo'yicha suhbatlar soni
        Map<String, Long> staffPerformance = allInteractions.stream()
                .filter(i -> !"Tizim".equalsIgnoreCase(i.getType()))
                .collect(Collectors.groupingBy(i -> i.getUser().getFullName(), Collectors.counting()));

        // 3. Xodimlar bo'yicha biriktirilgan mijozlar soni
        Map<String, Long> staffCustomers = allCustomers.stream()
                .filter(c -> c.getAssignedTo() != null)
                .collect(Collectors.groupingBy(c -> c.getAssignedTo().getFullName(), Collectors.counting()));

        // 4. Xodimlar bo'yicha jami buyurtmalar soni
        Map<String, Long> staffOrders = allCustomers.stream()
                .filter(c -> c.getAssignedTo() != null && c.getOrderCount() != null && c.getOrderCount() > 0)
                .collect(Collectors.groupingBy(
                        c -> c.getAssignedTo().getFullName(),
                        Collectors.summingLong(c -> c.getOrderCount().longValue())));

        // 5. Xodimlar bo'yicha jami daromad
        Map<String, Double> staffRevenue = allCustomers.stream()
                .filter(c -> c.getAssignedTo() != null && c.getDealValue() != null && c.getDealValue() > 0)
                .collect(Collectors.groupingBy(
                        c -> c.getAssignedTo().getFullName(),
                        Collectors.summingDouble(c -> c.getDealValue())));

        // 6. Active hamkorlar ulushi (%)
        double activeRatio = total > 0 ? ((double) active / total) * 100 : 0.0;
        activeRatio = Math.round(activeRatio * 10.0) / 10.0;

        // 7. O'sish hisob-kitobi: bugungi qo'shilgan mijozlar vs kechagi (createdAt taqqoslash)
        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime yesterdayStart = todayStart.minusDays(1);

        long todayNew = allCustomers.stream()
                .filter(c -> c.getCreatedAt() != null && c.getCreatedAt().isAfter(todayStart))
                .count();
        long yesterdayNew = allCustomers.stream()
                .filter(c -> c.getCreatedAt() != null
                        && c.getCreatedAt().isAfter(yesterdayStart)
                        && c.getCreatedAt().isBefore(todayStart))
                .count();

        // Agar kecha mijoz bo'lmagan bo'lsa: umumiy o'sish = bugungi / jami
        double growthRate;
        if (yesterdayNew > 0) {
            growthRate = ((double)(todayNew - yesterdayNew) / yesterdayNew) * 100;
        } else if (total > 0 && todayNew > 0) {
            growthRate = ((double) todayNew / total) * 100;
        } else {
            growthRate = 0.0;
        }
        growthRate = Math.round(growthRate * 10.0) / 10.0;

        // 8. Oxirgi 10 ta muloqot logi
        List<Map<String, Object>> recentInteractions = allInteractions.stream()
                .limit(10)
                .map(i -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", i.getId());
                    map.put("customerName", i.getCustomer().getName());
                    map.put("customerCompany", i.getCustomer().getCompany());
                    map.put("staffName", i.getUser().getFullName());
                    map.put("type", i.getType());
                    map.put("notes", i.getNotes());
                    map.put("time", i.getCreatedAt().toString());
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("lead", leads);
        stats.put("contacted", contacted);
        stats.put("proposal", proposal);
        stats.put("active", active);
        stats.put("inactive", inactive);
        stats.put("activeRatio", activeRatio);
        stats.put("totalRevenue", Math.round(totalRevenue));
        stats.put("totalOrders", totalOrders);
        stats.put("growthRate", growthRate);
        stats.put("todayNew", todayNew);
        stats.put("staffPerformance", staffPerformance);
        stats.put("staffCustomers", staffCustomers);
        stats.put("staffOrders", staffOrders);
        stats.put("staffRevenue", staffRevenue);
        stats.put("recentInteractions", recentInteractions);

        return ResponseEntity.ok(stats);
    }
}
