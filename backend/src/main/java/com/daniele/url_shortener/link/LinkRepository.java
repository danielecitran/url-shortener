package com.daniele.url_shortener.link;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LinkRepository extends JpaRepository<Link, Long> {

    Optional<Link> findByShortCode(String shortCode);

    List<Link> findAllByUserUserIdOrderByCreatedAtDesc(Long userId);
}
