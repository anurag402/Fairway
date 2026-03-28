import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function revealStagger(selector, options = {}) {
  const config = {
    y: 30,
    opacity: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: "power3.out",
    immediateRender: false,
    ...options,
  };

  gsap.from(selector, {
    ...config,
    scrollTrigger: {
      trigger: options.trigger || selector,
      start: "top 84%",
      once: true,
    },
  });
}

export function heroParallax(bgSelector, contentSelector) {
  gsap.to(bgSelector, {
    yPercent: 10,
    ease: "none",
    scrollTrigger: {
      trigger: bgSelector,
      scrub: true,
      start: "top top",
      end: "bottom top",
    },
  });

  gsap.from(contentSelector, {
    y: 40,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    immediateRender: false,
  });
}
