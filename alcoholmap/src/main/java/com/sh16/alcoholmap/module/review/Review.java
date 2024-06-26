package com.sh16.alcoholmap.module.review;


import com.sh16.alcoholmap.module.member.User;
import com.sh16.alcoholmap.module.place.Place;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@DynamicInsert
@DynamicUpdate
@Builder
@ToString
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long id;

    private String email;

    private float starRate;

    private String content;

    private Date createDate;

    private String image;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id")
    private Place place;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReviewComment> comments = new ArrayList<>();;

    public void editReview(ReviewDto.ReviewEditRequest reviewEditRequest) {
        this.starRate = reviewEditRequest.getStarRate();
        this.content = reviewEditRequest.getContent();
        this.createDate = new Date();
    }



}
