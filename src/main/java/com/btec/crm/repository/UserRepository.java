package com.btec.crm.repository;

import com.btec.crm.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Foydalanuvchini username bo'yicha qidirish (login logikasi uchun)
    Optional<User> findByUsername(String username);
}
