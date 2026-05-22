package com.btec.crm.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String company;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @Column(nullable = false)
    private String status; // Lead, Contacted, Proposal, Active, Inactive

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne
    @JoinColumn(name = "assigned_to_user_id")
    private User assignedTo; // Mijozga mas'ul xodim

    @Column(name = "deal_value")
    private Double dealValue = 0.0; // Kelishuv/shartnoma summasi

    @Column(name = "order_count")
    private Integer orderCount = 0; // Sotilgan buyurtmalar soni

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Constructors
    public Customer() {
        this.createdAt = LocalDateTime.now();
        this.dealValue = 0.0;
        this.orderCount = 0;
    }

    public Customer(String name, String company, String email, String phone, String status, String notes, User assignedTo) {
        this.name = name;
        this.company = company;
        this.email = email;
        this.phone = phone;
        this.status = status;
        this.notes = notes;
        this.assignedTo = assignedTo;
        this.dealValue = 0.0;
        this.orderCount = 0;
        this.createdAt = LocalDateTime.now();
    }

    public Customer(String name, String company, String email, String phone, String status, String notes, User assignedTo, Double dealValue, Integer orderCount) {
        this.name = name;
        this.company = company;
        this.email = email;
        this.phone = phone;
        this.status = status;
        this.notes = notes;
        this.assignedTo = assignedTo;
        this.dealValue = dealValue != null ? dealValue : 0.0;
        this.orderCount = orderCount != null ? orderCount : 0;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public User getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(User assignedTo) {
        this.assignedTo = assignedTo;
    }

    public Double getDealValue() {
        return dealValue;
    }

    public void setDealValue(Double dealValue) {
        this.dealValue = dealValue != null ? dealValue : 0.0;
    }

    public Integer getOrderCount() {
        return orderCount;
    }

    public void setOrderCount(Integer orderCount) {
        this.orderCount = orderCount != null ? orderCount : 0;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.dealValue == null) this.dealValue = 0.0;
        if (this.orderCount == null) this.orderCount = 0;
    }
}
