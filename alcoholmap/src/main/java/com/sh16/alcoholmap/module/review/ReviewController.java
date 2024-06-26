package com.sh16.alcoholmap.module.review;


import com.sh16.alcoholmap.common.PageIndexLessThanZeroException;
import com.sh16.alcoholmap.common.config.AuthConst;
import com.sh16.alcoholmap.module.jwt.JwtTokenProvider;

import com.sh16.alcoholmap.module.member.Response;
import com.sh16.alcoholmap.module.place.FirstMapPlaceDto;
import com.sh16.alcoholmap.module.place.PlaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class ReviewController {

    private final JwtTokenProvider jwtTokenProvider;
    private final ReviewService ReviewService;
    private final PlaceService placeService;

    /**
     * 식당 리뷰 가져오기
     * @param placeId
     * @param page
     * @param pageSize
     * @return
     * @throws PageIndexLessThanZeroException
     */
    @GetMapping("/place/review/{placeId}")
    public ResponseEntity<Response> getPlaceReviewsByUser(
              @PathVariable Long placeId
            , @RequestParam(defaultValue = "1") int page
            , @RequestParam(defaultValue = "10") int pageSize) throws PageIndexLessThanZeroException {
        try {
            return ReviewService.getPlaceAllReviewsByPlaceId(placeId, page, pageSize);
        } catch (ArithmeticException | IllegalArgumentException e) {
            throw new PageIndexLessThanZeroException();
        }
    }

    /**
     * 식당 리뷰 추가(저장)
     * @param myToken
     * @param review
     * @return
     */
    @PostMapping("/place/review")
    public ResponseEntity<Response> addPlaceReviews(@RequestHeader(AuthConst.AUTH_HEADER) String myToken, @RequestBody ReviewDto.ReviewRequest review) {
        if (myToken != null && myToken.startsWith("Bearer ")) {
            myToken = myToken.substring(7); // "Bearer " 문자열 이후의 토큰 값을 추출
        }
        jwtTokenProvider.validateToken(myToken);
        Authentication authentication = jwtTokenProvider.getAuthentication(myToken);
        String email = authentication.getName();
        return ReviewService.addPlaceReviews(email, review);
    }

    /**
     * 식당 리뷰 수정
     * @param review
     * @return
     */
    @PutMapping("/place/review/{userId}")
    public ResponseEntity<Response> editPlaceReviews(@PathVariable Long userId, @RequestBody ReviewDto.ReviewEditRequest review) {
        return ReviewService.editPlaceReviews(userId, review);
    }

    /**
     * 식당 리뷰 삭제
     * @param review
     * @return
     */
    @DeleteMapping("/place/review/{userId}")
    public ResponseEntity<Response> deletePlaceReviews(@PathVariable Long userId, @RequestBody ReviewDto.ReviewDeleteRequest review) {
        return ReviewService.deletePlaceReviews(userId, review);
    }

    /**
     * map 초기화면 주변 15개 술집의 정보 가져오기 - Body에 배열로만 요청
     */

    @PostMapping("/places/firstmap")
    public ResponseEntity<List<FirstMapPlaceDto>> getFirstMapPlaceReviews(@RequestBody List<Long> placeIds) {
        List<FirstMapPlaceDto> ratings = placeService.getRatingsByPlaceIds(placeIds);
        return ResponseEntity.ok(ratings);
    }
}
