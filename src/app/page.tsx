import Nav from '@/components/Nav/Nav';
import Hero from '@/components/Hero/Hero';
import StatsBar from '@/components/StatsBar/StatsBar';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import CaseStudies from '@/components/CaseStudies/CaseStudies';
import Pricing from '@/components/Pricing/Pricing';
import Contact from '@/components/Contact/Contact';
import Footer from '@/components/Footer/Footer';
import Divider from '@/components/Divider/Divider';
import ScrollRevealProvider from '@/components/ScrollRevealProvider/ScrollRevealProvider';

export default function Page() {
  return (
    <ScrollRevealProvider>
      <Nav />
      <main>
        <Hero />
        <StatsBar />
        <Divider />
        <HowItWorks />
        <Divider />
        <CaseStudies />
        <Divider />
        <Pricing />
        <Divider />
        <Contact />
      </main>
      <Footer />
    </ScrollRevealProvider>
  );
}
