package com.btec.crm.controller;

import com.btec.crm.model.User;
import com.btec.crm.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;

    @Autowired
    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ===================================================================
    // AUTHENTICATION APIs (Session-Based Security)
    // ===================================================================

    // 1. LOGIN API (POST /api/users/login)
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials, HttpSession session) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        Optional<User> optionalUser = userRepository.findByUsername(username.trim());
        
        if (optionalUser.isPresent() && optionalUser.get().getPassword().equals(password)) {
            User user = optionalUser.get();
            session.setAttribute("currentUser", user); // Sessiyaga yozish
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("username", user.getUsername());
            response.put("fullName", user.getFullName());
            response.put("role", user.getRole());
            
            return ResponseEntity.ok(response);
        }

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", "ERROR");
        errorResponse.put("message", "Username yoki parol noto'g'ri!");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }

    // 2. CHECK ME SESSION (GET /api/users/me)
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe(HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("username", currentUser.getUsername());
        response.put("fullName", currentUser.getFullName());
        response.put("role", currentUser.getRole());
        return ResponseEntity.ok(response);
    }

    // 3. LOGOUT API (POST /api/users/logout)
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpSession session) {
        session.invalidate(); // Sessiyani o'chirish
        Map<String, String> response = new HashMap<>();
        response.put("status", "LOGOUT");
        return ResponseEntity.ok(response);
    }

    // ===================================================================
    // STAFF (USERS) MANAGEMENT APIs (Faqat SUPER_ADMIN uchun)
    // ===================================================================

    // 4. GET ALL STAFF (GET /api/users)
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers(HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        
        // Faqat logindan o'tgan SUPER_ADMIN va CEO xodimlar ro'yxatini ko'ra oladi
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!"SUPER_ADMIN".equalsIgnoreCase(currentUser.getRole()) && !"CEO".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(userRepository.findAll());
    }

    // 5. CREATE NEW STAFF (POST /api/users)
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User newUser, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        
        // Faqat SUPER_ADMIN yangi xodim qo'sha oladi!
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!"SUPER_ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            if (userRepository.findByUsername(newUser.getUsername()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build(); // Username band
            }
            User savedUser = userRepository.save(newUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    // 6. DELETE STAFF (DELETE /api/users/{id})
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteUser(@PathVariable Long id, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        
        // Faqat SUPER_ADMIN xodimni o'chira oladi!
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!"SUPER_ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isPresent()) {
            // O'z-o'zini o'chirishni taqiqlash
            if (optionalUser.get().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            userRepository.delete(optionalUser.get());
            Map<String, Boolean> response = new HashMap<>();
            response.put("deleted", Boolean.TRUE);
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
}
