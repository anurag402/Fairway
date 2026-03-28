import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import toast from "react-hot-toast";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { featureCards } from "../utils/constants";
import { heroParallax, revealStagger } from "../animations/gsapAnimations";
import { fadeUp, pageVariants } from "../animations/motionVariants";
import { fetchCharitiesWithFilters } from "../services/charityService";
import { getApiErrorMessage } from "../utils/apiError";

const MotionSection = motion.section;

export function HomePage() {
  const [charities, setCharities] = useState([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      heroParallax(".hero-bg", ".hero-content");
      revealStagger(".feature-reveal", { trigger: ".feature-grid" });
      revealStagger(".charity-reveal", { trigger: ".charity-grid", y: 20 });
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    async function loadCharities() {
      try {
        const featuredData = await fetchCharitiesWithFilters({
          featured: true,
        });
        const featuredList = featuredData.charities || [];

        if (featuredList.length) {
          setCharities(featuredList.slice(0, 2));
          return;
        }

        const data = await fetchCharitiesWithFilters();
        setCharities((data.charities || []).slice(0, 2));
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, "Unable to load charities right now."),
        );
      }
    }

    loadCharities();
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-14 pb-16"
    >
      <MotionSection
        variants={fadeUp}
        className="hero-bg relative isolate overflow-hidden rounded-4xl border border-slate-200 dark:border-white/10 p-8 sm:p-12"
      >
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.24),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.2),transparent_45%),linear-gradient(180deg,rgba(248,250,252,0.82),rgba(226,232,240,0.9))] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.25),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.25),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.65),rgba(2,6,23,0.9))]" />

        <div className="hero-content relative z-10 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
            Premium Subscription Platform
          </p>
          <h1 className="text-balance text-4xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-5xl">
            Win monthly draws while funding meaningful community impact.
          </h1>
          <p className="mt-4 max-w-xl text-slate-600 dark:text-slate-300 sm:text-lg">
            A clean, modern member experience for score tracking, transparent
            rewards, and charity-first contributions.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup">
              <Button>Subscribe Now</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="secondary">Explore Dashboard</Button>
            </Link>
          </div>
        </div>
      </MotionSection>

      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Built for modern membership products
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Fast workflows, clear data, and delightful transitions in every
            screen.
          </p>
        </div>
        <div className="feature-grid grid gap-4 sm:grid-cols-2">
          {featureCards.map((feature) => (
            <Card key={feature.title} className="feature-reveal" hover>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Charity spotlight
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Subscribers can align every payment with a cause they care about.
            </p>
          </div>
          <Link
            to="/charities"
            className="text-sm font-medium text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            View all charities
          </Link>
        </div>

        <div className="charity-grid grid gap-4 md:grid-cols-2">
          {charities.length ? (
            charities.slice(0, 2).map((charity) => (
              <Card key={charity._id} className="charity-reveal" hover>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                    Featured Cause
                  </p>
                  <span className="rounded-full border border-slate-200 dark:border-white/15 px-3 py-1 text-xs text-slate-700 dark:text-slate-200">
                    Live
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">
                  {charity.name}
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  {charity.description}
                </p>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Charity spotlight is currently unavailable.
              </p>
            </Card>
          )}
        </div>
      </section>
    </motion.div>
  );
}
