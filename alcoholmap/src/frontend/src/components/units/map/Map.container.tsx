import { ChangeEvent, MouseEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import MapUI from './Map.presenter';
import _debounce from 'lodash/debounce'
import Modal from 'react-modal';
import ModalContainer from './Modal.container';
import modalStyles from './Modal.styles';
import { Coordinates, Options, PlaceInfo } from './Map.types';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { KeyObject } from 'crypto';

Modal.setAppElement('#__next');

export default function MapPage(): JSX.Element{
    const router = useRouter()

    const [keyword, setKeyword] = useState("술집");
    const [kwError, setKwError] = useState("");
    const [options, setOptions] = useState<Options | null>({
        center: null,
        level: 2,
    });
    const [map, setMap] = useState<any | null>(null);
    const [ps, setPs] = useState<any | null>(null);
    const [markers, setMarkers] = useState<any[]>([])
    const [userPosition,setUserPosition] = useState<Coordinates | null>({
        coords:{latitude: 0, longitude: 0},
    });
    const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [radius, setRadius] = useState(500);
    const [isLoggedIn, setLoggedIn] = useState(false);
    const [isDragSearch, setIsDragSearch] = useState(false)
    const [sortOption, setSortOption] = useState(1)
    const [isSearchClick, setIsSearchClick] = useState(0)
    const [placeData, setPlaceData] = useState<PlaceInfo[] | null>(null)
    const [pagination, setPagination] = useState<any[] | null>(null)
    //const [testtoken, setToken] = useState(false);
    
    useEffect(() => {
        checkIsLoggedIn();
    }, []);

    useEffect(() => {
        const script = document.createElement("script");
        script.async = true;
        script.src =
            "//dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=874eea7b48b7810e4c254737d3892e8f&libraries=services";
    
        script.onload = () => {
            console.log('Kakao Maps SDK loaded successfully!');
            window.kakao.maps.load(() => {
                fetchData();
            });
        };
        document.head.appendChild(script);
    
        return () => {
        };
    }, [ps]);

    useEffect(() => { // 정렬 기준이 바뀔 때 기준이 적용된 검색 결과 다시 표시
        if (ps && map) {
            if(keyword === "") {
                toast.configure();
                toast.dismiss();
                toast.warn("키워드를 입력해주세요.");
                return;
            }
            const center = map.getCenter();
            const latitude = center.getLat();
            const longitude = center.getLng();
            ps.keywordSearch(keyword, placesSearchCB, {
                location: new window.kakao.maps.LatLng(latitude, longitude),
                radius: radius === 0 ? 500 : radius,
                category_group_code: "FD6",
                level: 5,
            });
        }
    }, [radius]);

    useEffect(() => {
        if(placeData){
            const sortedData = selectSort(sortOption, placeData);
            displayPlaces(sortedData);
            displayPagination(pagination);
                return;
            } 
    }, [sortOption]);

    useEffect(() => {
        const handleMapDragEnd = _debounce(async () => {
            try {
                if (ps && map){ // 맵의 중심 좌표를 가져와서 검색 수행
                    const keyword = (document.getElementById('keyword') as HTMLInputElement).value || '';
                    if(keyword === "") {
                        toast.configure();
                        toast.dismiss();
                        toast.warn("키워드를 입력해주세요.");
                        return;
                    }
                    //@ts-ignore // kakao api 함수
                    const center = map.getCenter();
                    const latitude = center.getLat();
                    const longitude = center.getLng(); //@ts-ignore // kakao api 함수
                    const level = map.getLevel();
                    removeMarker();
                    
                    //@ts-ignore // kakao api 함수
                    const result = await ps.keywordSearch(keyword, placesSearchCB, {
                        location: new window.kakao.maps.LatLng(latitude, longitude),
                        radius: (radius===0? 500: radius),
                        category_group_code: "FD6",
                        level: 5,
                        //level = level,
                    });
                } else{
                    //console.error('Error handling map drag end: ps is null')
                }
                
            } catch (error) {
                console.error('Error handling map drag end:', error);
            }
        }, 500);
    
        if (map && isDragSearch) {
            window.kakao.maps.event.addListener(map, 'dragend', handleMapDragEnd);
        }
    
        return () => {
            if (map) {
                window.kakao.maps.event.removeListener(map, 'dragend', handleMapDragEnd);
            }
        };
    }, [map, isDragSearch, isSearchClick]);

    // ----------------------------------------------

    const checkIsLoggedIn = async () => { //로그인 확인 함수
        // 로컬 스토리지에서 토큰 가져오기
        const token = localStorage.getItem("your_token_key_here");

        // 토큰이 없으면 처리
        if (!token) {
            console.error("Token not found in local storage");
            setLoggedIn(true); //토큰이 없을 시 false
            return;
        }

        // API 요청 헤더에 토큰 추가
        /*const headers = {
            Authorization: `Bearer ${token}`,
            Content-Type: 'application/json',
            // 다른 헤더도 필요한 경우 추가
        };*/
        setLoggedIn(true);
    };

    const fetchData = async () => {
        try {
            console.log("fetchData");
            // 사용자의 현재 위치를 받아오기
            const userPosition= await getUserPosition();
            setUserPosition(userPosition as Coordinates)
            console.log('User Position:', userPosition);
            console.log(typeof userPosition);
            // 초기 지도 설정
            const options = {
                center: new window.kakao.maps.LatLng(
                    (userPosition as Coordinates | null)?.coords.latitude,
                    (userPosition as Coordinates | null)?.coords.longitude
                ),
                level: 2,
            };
            console.log(options);
            setOptions(options);

            // 기존의 맵이 있으면 그 맵을 사용하고, 없으면 새로운 맵을 생성
            const newMap = map || new window.kakao.maps.Map(
                document.getElementById('map'),
                options
            );
            setMap(newMap);

            const newPs = ps || new window.kakao.maps.services.Places();
            setPs(newPs);
            
            //kakao.maps.event.addListener(newMap, 'dragend', handleMapDragEnd);
            //kakao.maps.event.addListener(newMap, 'zoom_changed', handleMapDragEnd);
            //고려사항 zoom in/out 할때도 검색 진행?

            const center = map?.getCenter();
            const latitude = center?.getLat();
            const longitude = center?.getLng(); //@ts-ignore // kakao api 함수

            //@ts-ignore // kakao api 함수
            await ps?.keywordSearch(keyword, placesSearchCB, {
                location: new window.kakao.maps.LatLng(latitude, longitude),
                radius: (radius===0? 500: radius),
                category_group_code: "FD6",
                level: 5,
            });
            
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const getUserPosition = async (): Promise<Coordinates | null> => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve(position),
                (error) => reject(error)
            );
        });
    };

    // 키워드 검색을 요청하는 함수입니다
    const searchPlaces = async (event: ChangeEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            // 사용자의 위치를 기반으로 검색 수행
            const keyword = (document.getElementById('keyword') as HTMLInputElement).value || '';
            if (!keyword.replace(/^\s+|\s+$/g, '')) {
                toast.configure();
                toast.dismiss();
                toast.warn('키워드를 입력해주세요!');
                return false;
            }

            // 위도와 경도 추출
            const latitude = userPosition?.coords.latitude;
            const longitude = userPosition?.coords.longitude;

            //@ts-ignore // kakao api 함수
            ps?.keywordSearch(keyword, placesSearchCB, {
                location: new window.kakao.maps.LatLng(latitude, longitude),
                radius: (radius===0? 500: radius),// 반경 설정 안 할 시 기본 500m로
                category_group_code: "FD6", 
            });
        } catch (error) {
            console.error('Error searching places:', error);
        }
    };
    // 서버 response 예시
    const serverResponse: any[] = [
        {
            id: "1805535326",
            rating: 4.5, // 반올림 후: 5
            reviewCount: 120
        },
        {
            id: "1714692366",
            rating: 3.8, // 반올림 후: 4
            reviewCount: 85
        },
        {
            id: "596803138",
            rating: 3.3, // 반올림 후: 3
            reviewCount: 95
        },
        {
            id: "1648050966",
            rating: 2.6, // 반올림 후: 3
            reviewCount: 110
        },
        {
            id: "2075548768",
            rating: 1.9, // 반올림 후: 2
            reviewCount: 100
        },
        {
            id: "695042590",
            rating: 1.1, // 반올림 후: 1
            reviewCount: 150
        },
        {
            id: "782044578",
            rating: 3.7, // 반올림 후: 4
            reviewCount: 105
        },
        {
            id: "1332590568",
            rating: 4.4, // 반올림 후: 4
            reviewCount: 130
        },
        {
            id: "260149239",
            rating: 2.2, // 반올림 후: 2
            reviewCount: 160
        },
        {
            id: "455859409",
            rating: 1.5, // 반올림 후: 2
            reviewCount: 90
        },
        {
            id: "27305404",
            rating: 4.8, // 반올림 후: 5
            reviewCount: 170
        },
        {
            id: "1985864891",
            rating: 2.9, // 반올림 후: 3
            reviewCount: 95
        },
        {
            id: "1376591946",
            rating: 4.5, // 반올림 후: 5
            reviewCount: 125
        },
        {
            id: "20373658",
            rating: 3.7, // 반올림 후: 4
            reviewCount: 80
        }
    ];

    const placesSearchCB = (data: any, status: string, pagination: any): void => {        
        // 여기서 서버에서 받아와야함.
        addRatingAndReviewCount(data,serverResponse);
        setPagination(pagination);
        setPlaceData(data);
        const sortedData = selectSort(sortOption, data);
        if (status === kakao.maps.services.Status.OK) {
            displayPlaces(sortedData);
            displayPagination(pagination);
            return;
        } 
        else if (status === kakao.maps.services.Status.ZERO_RESULT) {
            toast.configure();
            toast.dismiss();
            toast.warn('검색 결과가 없습니다.', {
                position: toast.POSITION.TOP_RIGHT // 토스트 메시지를 중앙 하단에 배치
            });
            console.log("zero")
            return;
        }
        else if (status === kakao.maps.services.Status.ERROR) {
            console.log('Error');
            return;
        }
    }
    const selectSort = (option: number, data: PlaceInfo[]): PlaceInfo[] => {
        switch (option) {
            case 1: // 거리순
                setSortOption(1);
                return sortByDistance(data);
            case 2: // 별점순
                setSortOption(2);
                return sortByStarRate(data);
            case 3: // 리뷰순
                setSortOption(3);
                return sortByReview(data);
            default: // 기본은 거리순
                setSortOption(1);
                return sortByDistance(data);
        }
    };

    const sortByDistance = (data: PlaceInfo[]): PlaceInfo[] => { //거리순 정렬
        return data.sort((a: PlaceInfo, b: PlaceInfo) => {
            const distanceA = parseInt(a.distance);
            const distanceB = parseInt(b.distance);
            return distanceA - distanceB;
        });
    };

    const sortByStarRate = (data: PlaceInfo[]): PlaceInfo[] => { // 별점순 정렬
        return data.sort((a: PlaceInfo, b: PlaceInfo) => {
            const ratingA = a.rating !== undefined ? a.rating : 0;
            const ratingB = b.rating !== undefined ? b.rating : 0;
            return ratingB - ratingA // 내림차순 정렬
        });
    };

    const sortByReview = (data: PlaceInfo[]): PlaceInfo[] => { // 리뷰순 정렬
        return data.sort((a: PlaceInfo, b: PlaceInfo) => {
            const reviewCountA = a.reviewCount !== undefined ? a.reviewCount : 0;
            const reviewCountB = b.reviewCount !== undefined ? b.reviewCount : 0; 
    
            return reviewCountB - reviewCountA; // 내림차순 정렬
        });
    };

    // 서버로부터 받아온 별점과 리뷰개수 넣기.
    const addRatingAndReviewCount = (places: PlaceInfo[], serverResponse: { id: string; rating: number; reviewCount: number }[]): PlaceInfo[] => {
        return places?.map(place => {
            const data = serverResponse.find(item => item.id === place.id);
            if (data) {
                place.rating = data.rating;
                place.reviewCount = data.reviewCount;
            }
            return place;
        });
    };

    const displayPlaces = (places: any): void => {
        let listEl = document.getElementById('placesList'),
            menuEl = document.getElementById('menu_wrap'),
            fragment = document.createDocumentFragment(), 
            bounds = new kakao.maps.LatLngBounds();
        
        // 검색 결과 목록에 추가된 항목들을 제거합니다
        if(listEl){
            removeAllChildNods(listEl);
        }
        
        // 지도에 표시되고 있는 마커를 제거합니다
        removeMarker();
        
        // 마커 배열 초기화
        setMarkers([])

        for (let i=0; i<places.length; i++ ) {
            // 마커를 생성하고 지도에 표시합니다
            let placePosition = new kakao.maps.LatLng(places[i].y, places[i].x),
                marker = addMarker(placePosition, i, places[i].rating), 
                itemEl = getListItem(i, places[i]); // 검색 결과 항목 Element를 생성합니다
            
            // 검색된 장소 위치를 기준으로 지도 범위를 재설정하기위해
            // LatLngBounds 객체에 좌표를 추가합니다
            bounds.extend(placePosition);
    
            // 마커와 검색결과 항목에 mouseover 했을때
            // 해당 장소에 인포윈도우에 장소명을 표시합니다
            // mouseout 했을 때는 인포윈도우를 닫습니다
            
            (function (marker, title, place) {
                kakao.maps.event.addListener(marker, 'click', function () {
                    displayInfowindow(marker, title, true);
                    onMarkerClick(place);
                    
                });
    
                itemEl.onclick = function () {
                    displayInfowindow(marker, title, true);
                    onMarkerClick(place);
                };
            })(marker, places[i].place_name, places[i]);
            
            (function(marker, title) {
                kakao.maps.event.addListener(marker, 'mouseover', function() {
                    displayInfowindow(marker, title, false);
                });
    
                itemEl.onmouseover =  function () {
                    displayListInfowindow(marker, title, itemEl, false);
                };
            })(marker, places[i].place_name);
    
            fragment.appendChild(itemEl);
        }
    
        // 검색결과 항목들을 검색결과 목록 Element에 추가합니다
        listEl?.appendChild(fragment);
        if (menuEl) {
            menuEl.scrollTop = 0;
        }
    
        // 검색된 장소 위치를 기준으로 지도 범위를 재설정합니다
        if (map) { //@ts-ignore // kakao api 함수
            map.setBounds(bounds);
        }
    }

    const getListItem = (index: number, places: any): any => {
        const roundedRating = Math.round(places.rating);
        const el: HTMLElement = document.createElement('li');
        let itemStr : string = (`<span style ="float:right"><img src ="/soju1.png"/></span>`).repeat(roundedRating);
        itemStr += `<div>${places.place_name}</div>`;
        itemStr += `<span>리뷰(${places.reviewCount ? places.reviewCount : 0})<br/></span>`
    
        if (places.road_address_name) {
            itemStr += `<span>${places.road_address_name}</span><br/>`;
        } else {
            itemStr += `<span>${places.address_name}</span><br/>`; 
        }
        if (places.phone){
            itemStr += `<span class="tel">☎ ${places.phone}</span><hr/>`;     
        } else {
            itemStr += '<hr/>';
        }
                
        el.innerHTML = itemStr;
        el.className = 'item';
    
        return el;
    }

    const addMarker = (position: any, idx: number, rating: number): any => {
        let imageSrc = selectMarkerImgbyRating(rating); // 마커 이미지 url, 스프라이트 이미지를 씁니다
        let imageSize = new window.kakao.maps.Size(20, 50),  // 마커 이미지의 크기
            /*imgOptions = {
            },*/
        markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize, /*imgOptions*/),
        marker = new window.kakao.maps.Marker({
            position: position, // 마커의 위치
            image: markerImage
        });
    
        marker.setMap(map); // 지도 위에 마커를 표출합니다

        setMarkers(prevMarkers => [...prevMarkers, marker]);  // 배열에 생성된 마커를 추가합니다
    
        return marker;
    };

    const selectMarkerImgbyRating = (rating: number): string => {
        if (rating >= 4.5 && rating <= 5.0) {
            return '/bluesoju.png';
        } else if (rating >= 3.5 && rating < 4.5) {
            return '/orangesoju.png';
        } else if (rating < 3.5){
            return '/redsoju.png';
        } else {
            return '/greensoju.png';
        }
    };

    const removeMarker = (): any => {
        // 이전에 생성된 마커들 제거
        setMarkers(prevMarkers => { //@ts-ignore // kakao api 함수
            prevMarkers.forEach(marker => marker.setMap(null));
            return []; // Clear the markers array
        });
    }

    const displayPagination = (pagination: any): any => {
        let paginationEl = document.getElementById('pagination'),
            fragment = document.createDocumentFragment(),
            i; 
    
        if (paginationEl) {
            // 기존에 추가된 페이지번호를 삭제합니다
            paginationEl.innerHTML = '';
        
            for (i = 1; i <= pagination.last; i++) {
                let el = document.createElement('a');
                el.href = "#";
                el.innerHTML = String(i);
        
                if (i === pagination.current) {
                el.className = 'on';
                } else {
                el.onclick = (function (i) {
                    return function () {
                    pagination.gotoPage(i);
                    }
                })(i);
                }
                fragment.appendChild(el);
            }
            paginationEl.appendChild(fragment);
        }
    }

    const displayInfowindow = (marker: any, title: string, click: boolean) => {
        let content = 
            `<div class="overlay">
            ${title}
            </div>`;
        let lat = marker.getPosition().getLat();
        let lng = marker.getPosition().getLng(); 
        let position = new kakao.maps.LatLng(lat, lng);
        let newInfowindow = new kakao.maps.CustomOverlay({ 
            position: position,
            content: content,
            zIndex: 9999,
        });
        newInfowindow.setMap(map);
        if (click) {
            // 클릭 이벤트가 발생하면 5초 후에 인포윈도우를 닫음
            setTimeout(() => {
                newInfowindow.setMap(null);
            }, 5000);
        } else {
            kakao.maps.event.addListener(marker, 'mouseout', function() {
                newInfowindow.setMap(null);
            });
        }
    };

    const displayListInfowindow = (marker: any, title: string, itemEl : any, click: boolean): void => {
        let content = 
            `<div class="overlay">
            ${title}
            </div>`;
        let lat = marker.getPosition().getLat();
        let lng = marker.getPosition().getLng(); 
        let position = new kakao.maps.LatLng(lat, lng);
        let newInfowindow = new kakao.maps.CustomOverlay({ 
            position: position,
            content: content,
            zIndex: 9999,
        });
        newInfowindow.setMap(map);
        if (click) {
            // 클릭 이벤트가 발생하면 5초 후에 인포윈도우를 닫음
            setTimeout(() => {
                newInfowindow.setMap(null);
            }, 5000);
        } else {
            // 마우스가 마커에서 벗어났을 때 인포윈도우를 닫음
            itemEl.onmouseout =  function () { //@ts-ignore // kakao api 함수
                newInfowindow.setMap(null);
            };
        }
    }

    const removeAllChildNods = (el : HTMLElement) => {
        if (!el) {
          console.error("Element is null");
          return;
        }
      
        while (el.hasChildNodes()) {
            const lastChild = el.lastChild;
            if (lastChild !== null) {
              el.removeChild(lastChild);
            } else {
              console.error("lastChild is null");
            }
          }
    };
    
    const onClickRefreshLocation = async (): Promise<void> => {
        try {
            const newPosition = await getUserPosition();
            setUserPosition(newPosition);
            const newPositionLatLng = new kakao.maps.LatLng(
                userPosition?.coords.latitude,
                userPosition?.coords.longitude
            );
            const UserMarkerPos = new window.kakao.maps.LatLng( //지도에 사용자 위치 표시
                (userPosition as Coordinates | null)?.coords.latitude,
                (userPosition as Coordinates | null)?.coords.longitude
            );
            createAndRemoveMarker(UserMarkerPos);

            map.panTo(newPositionLatLng);
        } catch (error) {
            console.error('Error handling button click:', error);
        }
    };

    const createAndRemoveMarker = (userMarkerPos: any) => {
        // 마커 생성
        const newMarker = new kakao.maps.Marker({
            position: userMarkerPos,
            map: map,
            title: '마커',
        });
    
        // 5초 후에 마커를 제거하는 타이머 설정
        setTimeout(() => {
            // 마커가 존재하면 지도에서 제거
            if (newMarker) {
                newMarker.setMap(null);
            }
        }, 5000);
    };

    // -------------------모달 관련 함수-----------------------

    // 마커 클릭 이벤트 핸들러
    const onMarkerClick = (place: any): void => {
        setSelectedPlace(place);
        openModal(); // 모달창 열기
    };
    
    // 목록 항목 클릭 이벤트 핸들러
    /*const onListItemClick = (place) => {
        setSelectedPlace(place);
        openModal(); // 모달창 열기
    };*/
    
    // 모달창 열기 함수
    const openModal = (): void => {
        setIsModalOpen(true);
    };
    
    // 모달창 닫기 함수
    const closeModal = (): void => {
        setIsModalOpen(false);
    };

    const modalContent = selectedPlace && (
        <ModalContainer
            selectedPlace={selectedPlace}
            closeModal={closeModal}
            isLoggedIn={isLoggedIn}
            isOpen ={isModalOpen}
        />
    );
        
    // -------------------------------------------------------
    const onClickDragSearch = () => {
        setIsDragSearch(prevIsDragSearch => !prevIsDragSearch);
    };

    const onClickMoveToMypage = () => {
        router.push("../mypage")
    }

    const onClickMoveToLogin = () => {
        router.push("../login")
    }

    const onClickMoveToSignup = () => {
        router.push("../signup")
    }

    const onClickLogout = () => {
        setLoggedIn(false)
        localStorage.removeItem("jwtToken")
    }

    const onClickReload = () => {
        window.location.reload();
    }

    const onChangeKeyword = (event: ChangeEvent<HTMLInputElement>): void => {
        setKeyword(event.target.value)
        if(event.target.value !== ""){
            setKwError("")
        }
    }
    const onChangeRadius = (event: ChangeEvent<HTMLSelectElement>): void => {
        setRadius(+event.target.value)
    }
    const onChangeSelectOption = (event: ChangeEvent<HTMLSelectElement>): void => {
        setSortOption(+event.target.value);
    };
    
    const onClickSearch = () => {
        setIsSearchClick(prevIsSearchClick => prevIsSearchClick + 1);
    }
    
    // 별점 평점 -------


    return (
        <>
            <Modal
                isOpen={isModalOpen}
                style={modalStyles}
            >
                {modalContent}
            </Modal>

            <MapUI
                onClickMoveToMypage = {onClickMoveToMypage}
                onClickMoveToLogin = {onClickMoveToLogin}
                onClickMoveToSignup = {onClickMoveToSignup}
                onClickLogout = {onClickLogout}
                onClickReload = {onClickReload}
                onChangeKeyword = {onChangeKeyword}
                onChangeRadius = {onChangeRadius}
                searchPlaces = {searchPlaces}
                keyword = {keyword}
                radius = {radius}
                isLoggedIn = {isLoggedIn}
                isDragSearch = {isDragSearch}
                sortOption = {sortOption}
                onClickRefreshLocation = {onClickRefreshLocation}
                onClickDragSearch = {onClickDragSearch}
                onChangeSelectOption = {onChangeSelectOption}
                onClickSearch = {onClickSearch}
            />
        </>
        
    )
}