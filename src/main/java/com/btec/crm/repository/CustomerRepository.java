package com.btec.crm.repository;

import com.btec.crm.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    
    // Mijozlarni ismi yoki kompaniyasi bo'yicha qidirish
    List<Customer> findByNameContainingIgnoreCaseOrCompanyContainingIgnoreCase(String name, String company);
    
    // Status bo'yicha saralash
    List<Customer> findByStatus(String status);
}
