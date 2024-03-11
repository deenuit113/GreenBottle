package com.sh16.alcoholmap.module.review;


import com.sh16.alcoholmap.common.PageIndexLessThanZeroException;
import com.sh16.alcoholmap.common.config.AuthConst;
import com.sh16.alcoholmap.module.jwt.JwtTokenProvider;

import com.sh16.alcoholmap.module.member.Response;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final JwtTokenProvider jwtTokenProvider;
    private final ReviewService ReviewService;

    /**
     * 식당 리뷰 가져오기
     * @param placeId
     * @param page
     * @param pagesize
     * @return
     * @throws PageIndexLessThanZeroException
     */
//    @GetMapping("/place/review/{placeId}")
//    public ResponseEntity<Response> getPlaceReviewsByUser(@PathVariable int placeId
//            , @RequestParam(defaultValue = "1") int page
//            , @RequestParam(defaultValue = "10") int pagesize) throws PageIndexLessThanZeroException {
//        try {
//            return ReviewService.getPlaceAllReviewsByPlaceId(placeId, page, pagesize);
//        } catch (ArithmeticException | IllegalArgumentException e) {
//            throw new PageIndexLessThanZeroException();
//        }
//    }

    /**
     * 식당 리뷰 추가(저장)
     * @param myToken
     * @param review
     * @return
     */
    @PostMapping("/place/review")
    public ResponseEntity<Response> addPlaceReviews(@RequestHeader(AuthConst.AUTH_HEADER) String myToken, @RequestBody ReviewDto.ReviewRequest review) {
        jwtTokenProvider.validateToken(myToken);
        Authentication authentication = jwtTokenProvider.getAuthentication(myToken);
        String userId = authentication.getName();
        return ReviewService.addPlaceReviews(userId, review);
    }

    /**
     * 식당 리뷰 수정
     * @param myToken
     * @param review
     * @return
     */
//    @PutMapping("/place/review")
//    public ResponseEntity<Response> editPlaceReviews(@RequestHeader(AuthConst.AUTH_HEADER) String myToken, @RequestBody ReviewDto.ReviewEditRequest review) {
//        String token = TokenUtils.getTokenFromHeader(myToken);
//        String userId = TokenUtils.getUserIdFromToken(token);
//        return ReviewService.editPlaceReviews(userId, review);
//    }

    /**
     * 식당 리뷰 삭제
     * @param myToken
     * @param review
     * @return
     */
//    @DeleteMapping("/place/review")
//    public ResponseEntity<Response> deletePlaceReviews(@RequestHeader(AuthConst.AUTH_HEADER) String myToken, @RequestBody ReviewDto.ReviewDeleteRequest review) {
//        String token = TokenUtils.getTokenFromHeader(myToken);
//        String userId = TokenUtils.getUserIdFromToken(token);
//        return ReviewService.deletePlaceReviews(userId, review);
//    }
}
