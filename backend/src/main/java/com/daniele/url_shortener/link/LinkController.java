package com.daniele.url_shortener.link;

import com.daniele.url_shortener.link.dto.CreateLinkRequest;
import com.daniele.url_shortener.link.dto.CreateLinkResponse;
import com.daniele.url_shortener.link.dto.LinkSummaryResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/links")
@RequiredArgsConstructor
public class LinkController {

    private final LinkService linkService;

    @PostMapping
    public ResponseEntity<CreateLinkResponse> create(@Valid @RequestBody CreateLinkRequest request) {
        CreateLinkResponse response = linkService.createShortLink(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<List<LinkSummaryResponse>> getMyLinks(@RequestParam Long userId) {
        List<LinkSummaryResponse> links = linkService.getLinksForUser(userId);
        return ResponseEntity.ok(links);
    }
}
