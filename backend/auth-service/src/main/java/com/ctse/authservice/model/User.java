package com.ctse.authservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Application user – also implements Spring Security's UserDetails
 * so it can be used directly by the authentication manager.
 */
@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_username", columnNames = "username"),
                @UniqueConstraint(name = "uq_email", columnNames = "email")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @NotBlank
    @Column(nullable = false)
    private String password;

    /**
     * Comma-separated role names, e.g. "ROLE_USER,ROLE_ADMIN".
     * Stored as a single column for simplicity; a join table would be
     * more appropriate for a production system.
     */
    @Column(nullable = false)
    @Builder.Default
    private String roles = "ROLE_USER";

    @Builder.Default
    private boolean active = true;

    @Column(updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant updatedAt;

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // ── UserDetails ───────────────────────────────────────────────────────────

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Arrays.stream(roles.split(","))
                .map(String::trim)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    public List<String> getRoleList() {
        return Arrays.stream(roles.split(",")).map(String::trim).collect(Collectors.toList());
    }

    @Override public boolean isAccountNonExpired()    { return active; }
    @Override public boolean isAccountNonLocked()     { return active; }
    @Override public boolean isCredentialsNonExpired(){ return active; }
    @Override public boolean isEnabled()              { return active; }
}
