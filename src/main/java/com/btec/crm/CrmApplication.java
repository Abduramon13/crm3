package com.btec.crm;

import com.btec.crm.model.Customer;
import com.btec.crm.model.Interaction;
import com.btec.crm.model.User;
import com.btec.crm.repository.CustomerRepository;
import com.btec.crm.repository.InteractionRepository;
import com.btec.crm.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;

@SpringBootApplication
public class CrmApplication {

    public static void main(String[] args) {
        SpringApplication.run(CrmApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository, 
                                          CustomerRepository customerRepository,
                                          InteractionRepository interactionRepository) {
        return args -> {
            // 1. DEFAULT USERLARNI YARATISH (Agar bazada yo'q bo'lsa)
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User("admin", "admin123", "Javohir Karimov", "SUPER_ADMIN");
                User manager = new User("manager", "manager123", "Olim Shokirov", "MANAGER");
                User ceo = new User("ceo", "ceo123", "Akmal Rahimov", "CEO");

                userRepository.save(admin);
                userRepository.save(manager);
                userRepository.save(ceo);

                System.out.println(">>> Default foydalanuvchilar (admin, manager, ceo) bazaga muvaffaqiyatli saqlandi.");

                // 2. DEFAULT MIJOZLARNI YARATISH
                Customer cust1 = new Customer("Sardor Rihsiyev", "Zara Tashkent LLC", "sardor@zara.uz", "+998 90 333-22-11", "Active", "Katta miqdordagi tayyor kiyim buyurtmalari bo'yicha hamkor.", manager, 75000000.0, 12);
                Customer cust2 = new Customer("Dilnoza Aliyeva", "Elegant Wear", "dilnoza@elegant.uz", "+998 93 444-55-66", "Proposal", "Bahor-yoz kolleksiyasi bo'yicha taklif yuborilgan.", manager, 45000000.0, 0);
                Customer cust3 = new Customer("Jahongir Umarov", "Sport Style", "jahongir@sportstyle.uz", "+998 97 777-88-99", "Contacted", "Telefon orqali birinchi suhbat o'tkazilgan.", admin, 0.0, 0);
                Customer cust4 = new Customer("Madina Sobirova", "Kids Textile", "madina@kids.uz", "+998 99 111-22-33", "Lead", "Saytdan arizani qoldirgan yangi xaridor.", admin, 0.0, 0);
                Customer cust5 = new Customer("Temur Alimov", "Apex Apparel", "temur@apex.uz", "+998 91 222-33-44", "Active", "Ko'ylaklar partiyasi buyurtmasi.", admin, 120000000.0, 18);
                Customer cust6 = new Customer("Shahlo Karimova", "Lola Fashion", "shahlo@lola.uz", "+998 95 555-44-33", "Active", "Bolalar kiyimi shartnomasi.", manager, 50000000.0, 8);

                customerRepository.save(cust1);
                customerRepository.save(cust2);
                customerRepository.save(cust3);
                customerRepository.save(cust4);
                customerRepository.save(cust5);
                customerRepository.save(cust6);

                System.out.println(">>> Boshlang'ich mijozlar ma'lumotlari bazaga yozildi.");

                // 3. DEFAULT MULOQOT TARIXLARINI YARATISH
                interactionRepository.save(new Interaction(cust1, manager, "Tizim", "Mijoz tizimga qo'shildi va Olim Shokirov biriktirildi."));
                interactionRepository.save(new Interaction(cust1, manager, "Telefon", "Bahorgi kolleksiya yetkazib berish bo'yicha shartnoma imzolandi."));
                interactionRepository.save(new Interaction(cust1, manager, "Uchrashuv", "Ofisda kiyim-kechak sifati va logistika masalalari muhokama qilindi."));

                interactionRepository.save(new Interaction(cust2, manager, "Tizim", "Mijoz tizimga qo'shildi va Olim Shokirov biriktirildi."));
                interactionRepository.save(new Interaction(cust2, manager, "Email", "Kiyimlar katalogi va narxlar taklifi yuborildi."));

                interactionRepository.save(new Interaction(cust3, admin, "Tizim", "Mijoz tizimga qo'shildi va Javohir Karimov biriktirildi."));
                interactionRepository.save(new Interaction(cust3, admin, "Telefon", "Birinchi marta telefon orqali bog'lanildi va talablar o'rganildi."));

                interactionRepository.save(new Interaction(cust4, admin, "Tizim", "Mijoz sayt orqali ariza qoldirdi va Javohir Karimov biriktirildi."));
                
                interactionRepository.save(new Interaction(cust5, admin, "Tizim", "Mijoz tizimga qo'shildi va Javohir Karimov biriktirildi."));
                interactionRepository.save(new Interaction(cust5, admin, "Taklif", "120 mln so'mlik ko'ylaklar buyurtmasi yopildi. Shartnoma faol."));

                interactionRepository.save(new Interaction(cust6, manager, "Tizim", "Mijoz tizimga qo'shildi va Olim Shokirov biriktirildi."));
                interactionRepository.save(new Interaction(cust6, manager, "Taklif", "50 mln so'mlik bolalar kiyimlari kelishuvi faollashtirildi."));

                System.out.println(">>> Muloqotlar tarixi loglari muvaffaqiyatli bog'landi.");
            }
        };
    }
}
