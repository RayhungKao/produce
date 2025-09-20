import "swiper/css";
import styles from "./index.module.scss";
import { useRef, useState, useEffect, useCallback } from "react";
import useWindowDevice from "@/hooks/use-window-device";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import _get from "lodash/get";
import cards from "./cards";

const swiperSettings = {
  loop: false,
  slidesPerView: 4,
  slidesPerGroup: 4,
  spaceBetween: 8,
  loopAddBlankSlides: false,
  centerInsufficientSlides: true,
  breakpoints: {
    640: {
      slidesPerView: 4,
      slidesPerGroup: 4,
      spaceBetween: 25,
    },
  },
  lazyPreloadPrevNext: 4,
};
const DEFAULT_PREVIEW_CARDS = 4;

export default function Show() {
  const sliderRef = useRef(null);
  const { isDesktop } = useWindowDevice();
  const [canShowArrow, setshowArrow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Show arrows only if we have more cards than can be displayed at once
      setshowArrow(isDesktop && cards.length > DEFAULT_PREVIEW_CARDS);
    }
  }, [isDesktop, mounted]);

  const updateArrowVisibility = useCallback((swiper) => {
    if (!swiper) return;
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
  }, []);

  const handlePrev = useCallback(() => {
    if (!sliderRef.current?.swiper) return;
    sliderRef.current.swiper.slidePrev();
    updateArrowVisibility(sliderRef.current.swiper);
  }, [updateArrowVisibility]);

  const handleNext = useCallback(() => {
    if (!sliderRef.current?.swiper) return;
    sliderRef.current.swiper.slideNext();
    updateArrowVisibility(sliderRef.current.swiper);
  }, [updateArrowVisibility]);

  const LeftArrow = useCallback(() => {
    return (
      <div
        className={`${styles.arrow} ${styles.leftArrow} ${
          isBeginning ? styles.disabled : ""
        }`}
        onClick={handlePrev}
      >
        <img
          className={styles.arrowImage}
          src="/assets/images/arrows/arrow-left.png"
          loading="lazy"
        />
      </div>
    );
  }, [isBeginning, handlePrev]);

  const RightArrow = useCallback(() => {
    return (
      <div
        className={`${styles.arrow} ${styles.rightArrow} ${
          isEnd ? styles.disabled : ""
        } 
        `}
        onClick={handleNext}
      >
        <img
          className={styles.arrowImage}
          src="/assets/images/arrows/arrow-right.png"
          loading="lazy"
        />
      </div>
    );
  }, [isEnd, handleNext]);

  const Card = useCallback(({ card }) => {
    return (
      <Link href={card.link} className={styles.link}>
        <div className={styles.card}>
          <div className={styles.imageBox}>
            <img
              className={styles.image}
              src={_get(card, "image.data.attributes.url")}
            />
          </div>
          <div className={styles.titleContainer}>
            <div className={styles.title}>{card.title}</div>
          </div>
        </div>
      </Link>
    );
  }, []);

  if (!cards || !mounted) return null;

  return (
    <div>
      <div className={styles.container}>
        <div className={styles.swiperContainer}>
          <Swiper
            {...swiperSettings}
            className={styles.swiper}
            ref={isDesktop ? sliderRef : null}
            onSwiper={(swiper) => {
              updateArrowVisibility(swiper);
            }}
            onSlideChange={(swiper) => {
              updateArrowVisibility(swiper);
            }}
          >
            {cards.map((card, index) => (
              <SwiperSlide key={`card-${index}-${card.title}`}>
                <Card card={card} />
              </SwiperSlide>
            ))}
          </Swiper>
          {canShowArrow && isDesktop && (
            <>
              <LeftArrow />
              <RightArrow />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
