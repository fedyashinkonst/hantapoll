import { MainBlock } from "./components/mainBlock/mainBlock";
import { AboutUs } from "./components/aboutUs/aboutUs";
import { WhyWe } from "./components/whyWe/whyWe";
import { HowItWork } from "./components/howitwork/howitwork";
import { Footer } from "./components/footer/footer";
import { Work } from "./components/work/work";

export default function Home() {
  return (
    <div style={{ backgroundColor: 'D6E8EE'}}>
      <MainBlock/>
      <AboutUs/>
      <WhyWe/>
      <HowItWork/>
      <Work/>
      <Footer/>
    </div>
  );
}