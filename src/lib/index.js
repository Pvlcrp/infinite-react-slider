import React from "react";

// Defaults
const TOTAL_TIME = 10000;
const OFFSET_TOP = 0;
const OFFSET_BOTTOM = 0;
const DEFAULT_DUPLICATES = 2;
const FPS = 1000 / 60;

// Base style for slide
const slideStyle = {
  display: "inline-flex",
  alignItems: "center",
  verticalAlign: "middle"
};


/**
 * Get slides height and width
 * @param {HTMLElement} slider Slider element
 * @param {number} initialLength Original number of slice (before duplicating)
 */
const getSlidesData = (slider, initialLength = 0) => {
  if (!slider) return [];
  const slides = [].slice.call(slider.children);
  return slides.slice(0, initialLength).map(
    (slide) => {
      return {
        width: slide.offsetWidth,
        height: slide.offsetHeight,
      }
    }
  );
}


const Slider = (
  {
    children,
    totalTime = TOTAL_TIME,
    offsetTop = OFFSET_TOP,
    offsetBottom = OFFSET_BOTTOM,
    fps = FPS,
    ...props
  }
) => {
  // Slider
  const ref = React.useRef();

  // With / Height
  const [sliderWidth, setSliderWidth] = React.useState("auto");
  const [sliderHeight, setSliderHeight] = React.useState("auto");

  // Duplicated slides
  const [duplicates, setDuplicates] = React.useState(1);

  // Animation
  const [translate, setTranslate] = React.useState(0);
  const currentTime = React.useRef();
  const frameId = React.useRef();
  const lastProgressStep = React.useRef();
  const lastFrameTimestamp = React.useRef(); // Throttle

  // Save progress for play / pause
  React.useEffect(
    () => { lastProgressStep.current = translate; },
    [translate]
  );

  /**
   * Set progress based on time enlapsed
   * Reset when reaches the end
   * @param {number} timestamp Timestamp from requestAnimationFrame
   */
  const animateSlider = React.useCallback(
    (timestamp) => {
      if (!currentTime.current) currentTime.current = timestamp;

      // Throttle
      if (!lastFrameTimestamp.current) lastFrameTimestamp.current = timestamp;
      const timeEnlapsedSinceLastFrame = timestamp - lastFrameTimestamp.current;

      // Throttle
      if (timeEnlapsedSinceLastFrame > fps) {
        const progress = Math.min((timestamp - currentTime.current) / totalTime, 1);
        setTranslate(progress);

        // Throttle
        lastFrameTimestamp.current = null;

        if (progress < 1) {
          frameId.current = window.requestAnimationFrame(animateSlider);
        } else {
          currentTime.current = null;
          setTranslate(0);
          frameId.current = window.requestAnimationFrame(animateSlider);
        }
      } else {
        frameId.current = window.requestAnimationFrame(animateSlider);
      }
    },
    [
      setTranslate,
      fps,
      totalTime
    ],
  );

  /**
   * Pause slider animation
   */
  const pause = React.useCallback(
    () => {
      cancelAnimationFrame(frameId.current);
      frameId.current = null;
    },
    []
  );

  /**
   * Play slider from last step
   */
  const play = React.useCallback(
    () => {
      if (!frameId.current) {
        const timeEnlapsed = totalTime * lastProgressStep.current;

        frameId.current = window.requestAnimationFrame(
          (timestamp) => {
            currentTime.current = timestamp - timeEnlapsed;
            animateSlider(timestamp);
          }
        );
      }
    },
    [totalTime]
  );

  /**
   * Pause when document is hidden
   */
  const handleVisibilityChange = React.useCallback(
    () => {
      if (document.visibilityState === "hidden") pause();
      if (document.visibilityState === "visible" && isInViewport()) play();
    },
    [pause, play]
  );

  /**
   * Check if slider is in viewport
   */
  const isInViewport = React.useCallback(
    () => {
      const slider = ref.current;
      const rect = slider.getBoundingClientRect();
      const top = rect.top + rect.height - offsetTop;
      const bottom = rect.top + offsetBottom;
      return top > 0 && bottom < window.innerHeight;
    },
    [offsetTop, offsetBottom]
  );

  /**
   * Pause when slider leaves viewport
   */
  const handleViewportState = React.useCallback(
    () => {
      if (!isInViewport()) { pause() } else { play() }
    },
    [pause, play, isInViewport]
  );

  /**
   * Duplicate slides to fill screen
   */
  const duplicateSlides = React.useCallback(
    () => {
      if (sliderWidth < window.innerWidth) {
        const duplicateSize = (window.innerWidth / (sliderWidth / 2));
        setDuplicates(parseInt(duplicateSize));
      } else {
        setDuplicates(DEFAULT_DUPLICATES);
      }
    },
    [
      setDuplicates,
      sliderWidth
    ]
  )

  /**
   * Set slider height based on slide max height
   */
  const updateSliderHeight = React.useCallback(
    () => {
      const slider = ref.current;
      const slidesData = getSlidesData(slider, children.length);
      const maxHeight = slidesData.reduce((a, b) => a > b.height ? a : b.height, 0);
      setSliderHeight(maxHeight);
    },
    [setSliderHeight, children.length]
  );

  // Add slides to have infinite effect
  React.useEffect(
    () => {
      duplicateSlides();
      window.addEventListener("resize", duplicateSlides);
      return () => window.removeEventListener("resize", duplicateSlides);
    },
    [duplicateSlides]
  );

  /**
   * Set slider height
   */
  React.useEffect(
    () => {
      updateSliderHeight();
      window.addEventListener("resize", updateSliderHeight);
      return () => window.removeEventListener("resize", updateSliderHeight);

    },
    [updateSliderHeight]
  );


  /**
   * Set slider with and start animation
   */
  React.useEffect(() => {
    const slider = ref.current;
    const slidesData = getSlidesData(slider, children.length);
    const totalWidth = slidesData.reduce((a, b) => a + b.width, 0);

    // Set slider width
    setSliderWidth(totalWidth);

    // Fire animation
    frameId.current = window.requestAnimationFrame(animateSlider);

    // Events
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("scroll", handleViewportState);

    // Clean Events
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("scroll", handleViewportState);
    }
  }, [
    animateSlider,
    handleVisibilityChange,
    handleViewportState,
    children.length
  ]);

  // Slide height
  const height = React.useMemo(
    () => typeof sliderHeight === 'string' ? sliderHeight : `${sliderHeight}px`,
    [sliderHeight]
  );

  // Slider total with
  const width = React.useMemo(
    () => typeof sliderWidth === 'string' ? sliderWidth : `${sliderWidth * duplicates}px`,
    [sliderHeight, duplicates]
  );

  return (
    <div {...props}>
      <div
        ref={ref}
        style={
          {
            width,
            transform: `translateX(-50%) translateX(-${translate * sliderWidth}px)`,
          }
        }
      >
        {
          new Array(duplicates).fill().map(
            (_, i) => children.map(
              (child, key) => {
                const id = `slide-${i}-${key}`;
                const style = { ...slideStyle, height };
                return <div key={id} style={style}>{child}</div>
              }
            )
          )
        }
      </div>
    </div>
  )
}

export default Slider;