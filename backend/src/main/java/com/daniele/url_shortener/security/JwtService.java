package com.daniele.url_shortener.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final Duration expirationDuration;
    private final String cookieName;

    public JwtService(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.expiration-days:7}") long expirationDays,
            @Value("${app.jwt.cookie-name:auth_token}") String cookieName
    ) {
        this.secretKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.expirationDuration = Duration.ofDays(expirationDays);
        this.cookieName = cookieName;
    }

    public String generateToken(Long userId, String email) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expirationDuration);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(secretKey)
                .compact();
    }

    public AuthenticatedUser parseToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        Long userId = Long.valueOf(claims.getSubject());
        String email = claims.get("email", String.class);
        return new AuthenticatedUser(userId, email);
    }

    public long getExpirationSeconds() {
        return expirationDuration.getSeconds();
    }

    public String getCookieName() {
        return cookieName;
    }
}
