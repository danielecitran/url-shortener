package com.daniele.url_shortener.link;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import com.daniele.url_shortener.user.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Datenbank Klasse (Entity-Klasse)
@Entity
// Tabellenname: links
@Table(name = "links")
@Getter
@Setter
@NoArgsConstructor

public class Link {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "link_id")
    private Long linkId;

    @Column(name = "original_url", nullable = false)
    private String originalUrl;

    @Column(name = "short_code", nullable = false, unique = true)
    private String shortCode;

    @Column(name = "click_count", nullable = false)
    private Long clickCount = 0L;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Methode die bevor ausgeführt wird
    @PrePersist
    private void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        // Wenn clickCount irgendwie doch auf null gesetzt wird, wird es auf 0 gesetzt
        if (clickCount == null) {
            clickCount = 0L;
        }
    }
}
