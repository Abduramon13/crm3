package com.btec.crm.repository;

import com.btec.crm.model.Interaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InteractionRepository extends JpaRepository<Interaction, Long> {
    
    // Mijoz bo'yicha muloqotlar tarixini vaqti bo'yicha kamayish tartibida olish
    List<Interaction> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    
    // Barcha muloqotlarni vaqti bo'yicha olish (Oxirgi qilingan ishlar/logs uchun)
    List<Interaction> findAllByOrderByCreatedAtDesc();
}
