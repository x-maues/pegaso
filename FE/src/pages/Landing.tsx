import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { formatAddress } from '../utils/format';
import { motion } from 'framer-motion';
import { ChevronDown, Check, Zap, Shield, TrendingUp, Coins, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setAllowed } from '@stellar/freighter-api';

const NoiseOverlay = () => (
  <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
  />
);

const HalftonePattern = ({ className }: { className?: string }) => (
  <div className={`absolute inset-0 opacity-20 pointer-events-none ${className}`}
    style={{
      backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
      backgroundSize: '8px 8px'
    }}
  />
);

const Navbar = ({ address, isConnected, onConnect, onNavigateToDashboard, onDisconnect, isScrolled }: { address: string, isConnected: boolean, onConnect: () => void, onNavigateToDashboard: () => void, onDisconnect: () => void, isScrolled: boolean }) => (
  <nav className={`fixed top-0 w-full z-50 px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center text-white transition-all duration-300 ${isScrolled ? 'backdrop-blur-md bg-black/30 border-b border-white/10' : ''}`}>
    <a href="/" className="flex flex-col leading-none cursor-pointer hover:opacity-80 transition-opacity">
      <span className="font-bold text-xl sm:text-2xl tracking-tighter">pegaso</span>
    </a>


    <div className="flex items-center gap-3 sm:gap-6">
      <div className="hidden md:flex gap-4 lg:gap-6 text-xs font-mono tracking-widest">
        <a href="#benefits" className="cursor-pointer hover:text-pink-500 transition-colors">BENEFITS</a>
        <a href="#how" className="cursor-pointer hover:text-pink-500 transition-colors">HOW IT WORKS</a>
        <a href="#protocols" className="cursor-pointer hover:text-pink-500 transition-colors">PROTOCOLS</a>
      </div>

      {isConnected ? (
        <div className="flex items-center gap-2">
          <div className="px-3 sm:px-4 py-2 bg-white text-black text-xs font-bold font-mono rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {formatAddress(address)}
          </div>
          <button
            onClick={onNavigateToDashboard}
            className="cursor-pointer px-4 sm:px-6 py-2 bg-[#2DD4BF] text-black rounded-full text-xs font-bold hover:bg-[#25b5a3] transition-all font-mono uppercase"
          >
            Dashboard
          </button>
          <button
            onClick={onDisconnect}
            className="cursor-pointer p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Disconnect Wallet"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="cursor-pointer px-4 sm:px-6 py-2 border border-white/30 rounded-full text-xs font-bold hover:bg-white hover:text-black transition-all font-mono uppercase"
        >
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </button>
      )}
    </div>
  </nav>
);

const BentoCard = ({
  children,
  className,
  title,
  subtitle,
  variant = 'default',
  delay = 0
}: {
  children?: React.ReactNode,
  className?: string,
  title: string,
  subtitle?: string,
  variant?: 'pink' | 'teal' | 'dark' | 'default',
  delay?: number
}) => {
  const bgColors = {
    pink: 'bg-[#FF0055] text-white',
    teal: 'bg-[#2DD4BF] text-black',
    dark: 'bg-[#111] text-white border border-white/10',
    default: 'bg-[#1a1a1a] text-white'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: false, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative overflow-hidden rounded-[2rem] p-8 flex flex-col justify-between group transition-colors duration-500 ${bgColors[variant]} ${className}`}
    >
      <NoiseOverlay />
      {variant !== 'default' && <HalftonePattern className={variant === 'teal' ? 'text-black' : 'text-white'} />}

      <div className="relative z-10">
        <h3 className="text-3xl font-bold uppercase tracking-tight mb-2 leading-none">{title}</h3>
        {subtitle && <p className="font-mono text-xs opacity-70 uppercase tracking-wider">{subtitle}</p>}
      </div>

      <div className="relative z-10 mt-12">
        {children}
      </div>

      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
};

export function DashboardPage() {
  const { address, isConnected, refreshAddress, disconnect } = useWallet();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleConnectClick = async () => {
    try {
      await setAllowed();
      await refreshAddress();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleNavigateToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF0055] selection:text-white overflow-x-hidden">
      <Navbar address={address} isConnected={isConnected} onConnect={handleConnectClick} onNavigateToDashboard={handleNavigateToDashboard} onDisconnect={handleDisconnect} isScrolled={isScrolled} />

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 overflow-hidden">

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] opacity-30 pointer-events-none z-10" />

          <div className="absolute mr-32 inset-0 z-0">
            <img
              src="/bgb.png"
              alt="pegaso"
              className="absolute left-1/2 top-[24%] -translate-x-1/2 -translate-y-1/2
              h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] object-contain opacity-90"
            />
            {/* Gradient Overlay for Bottom Fade */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/20 to-[#050505]" />
          </div>
        </div>

        <div className="relative z-10 max-w-[1400px] w-full flex flex-col items-center justify-center text-center space-y-8 sm:space-y-12">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "circOut" }}
            className="space-y-6 sm:space-y-8 flex flex-col items-center"
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.85] tracking-tighter text-white">
              pegaso
            </h1>



            <p className="max-w-2xl text-gray-400 font-mono text-sm md:text-base leading-relaxed tracking-wide px-4">
              Yield station on Stellar

            </p>



            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isConnected ? () => navigate('/dashboard') : handleConnectClick}
                className="cursor-pointer group relative px-8 sm:px-12 py-4 sm:py-6 bg-white text-black rounded-full overflow-hidden"
              >
                <span className="relative z-10 text-base sm:text-xl font-black uppercase flex items-center gap-2">
                  {isConnected ? 'Launch App' : 'Connect Wallet'}
                </span>
                <div className="absolute inset-0 bg-[#2DD4BF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              </motion.button>

            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
        >
          <span className="text-[10px] font-mono tracking-widest uppercase">Explore</span>
          <ChevronDown className="animate-bounce" />
        </motion.div>
      </section>

      {/* --- KEY BENEFITS SECTION --- */}
      <section id="benefits" className="px-4 sm:px-6 pb-24 sm:pb-32">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-12 border-b border-white/10 pb-4 sm:pb-6 gap-2">
            <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tighter">Key Benefits</h2>
            <span className="hidden md:block font-mono text-xs text-gray-500">WHY pegaso</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 auto-rows-[280px]">

            {/* Benefit 1 */}
            <BentoCard
              title="Choose Your Yield Strategy"
              subtitle="Your capital, your choice"
              variant="teal"
              delay={0.1}
            >
              <p className="text-sm leading-relaxed opacity-90">
                Select protocols and allocate percentages directly — safe lending, high-yield liquidity, or diversified vaults. <span className="font-bold">No forced automation.</span>
              </p>
              <div className="mt-4 flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-black/20 rounded-full text-xs font-mono">Blend 60%</span>
                <span className="px-3 py-1 bg-black/20 rounded-full text-xs font-mono">Aquarius 40%</span>
              </div>
            </BentoCard>

            {/* Benefit 2 */}
            <BentoCard
              title="Proportional & Fair Shares"
              subtitle="Transparent ownership"
              variant="dark"
              delay={0.2}
            >
              <Coins size={48} className="text-gray-700 mb-4" strokeWidth={1} />
              <p className="text-gray-400 text-sm leading-relaxed">
                Mint shares on deposit. Your portion grows with the chosen pools. Withdraw redeems principal + accrued yield fairly.
              </p>
            </BentoCard>

            {/* Benefit 3 */}
            <BentoCard
              title="Stellar-Native Efficiency"
              subtitle="Built for speed"
              variant="pink"
              delay={0.3}
            >
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-5xl font-black">{"<5s"}</div>

                  <div className="text-xs font-mono uppercase opacity-80 mt-1">Finality Time</div>
                </div>
                <Zap size={64} strokeWidth={1} className="opacity-50" />
              </div>
              <p className="text-sm leading-relaxed mt-4 opacity-90">
                Near-zero fees. Designed for frequent small deposits — perfect for remittances.
              </p>
            </BentoCard>

            {/* Benefit 4 */}
            <BentoCard
              title="Secure & Transparent"
              subtitle="Trust through code"
              variant="dark"
              delay={0.4}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-[#2DD4BF]" />
                  <span className="text-gray-300">Fully on-chain Soroban contracts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-[#2DD4BF]" />
                  <span className="text-gray-300">User authentication required</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-[#2DD4BF]" />
                  <span className="text-gray-300">Open-source code</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-[#2DD4BF]" />
                  <span className="text-gray-300">No admin keys</span>
                </div>
              </div>
              <Shield size={48} className="text-gray-800 mt-4" strokeWidth={1} />
            </BentoCard>

          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section id="how" className="bg-white text-black py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase mb-12 sm:mb-16 tracking-tighter">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-1">
            {[
              { id: '01', title: 'Connect Wallet', desc: 'Freighter, Albedo, or any Stellar wallet' },
              { id: '02', title: 'Deposit Assets', desc: 'XLM or supported tokens' },
              { id: '03', title: 'Choose Protocols', desc: '60% Blend + 40% Aquarius, or your mix' },
              { id: '04', title: 'Earn Yields', desc: 'Passively accrues in chosen pools' },
              { id: '05', title: 'Withdraw Anytime', desc: 'Redeem shares for principal + returns' },
            ].map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: "circOut" }}
                className="bg-[#E5E5E5] p-6 sm:p-8 min-h-[220px] flex flex-col justify-between hover:bg-[#d5d5d5] transition-all"
              >
                <span className="font-mono text-xs font-bold opacity-60">{step.id}</span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold uppercase mb-2">{step.title}</h3>
                  <p className="font-mono text-xs sm:text-sm opacity-80 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ECOSYSTEM STATS SECTION --- */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 bg-[#0a0a0a]">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tighter mb-8">Current Ecosystem Context</h2>
          <p className="text-sm font-mono text-gray-500 mb-8 uppercase tracking-wider">Stellar DeFi Today (February 2026)</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
              <div className="text-xs text-gray-500 uppercase mb-2">Total DeFi TVL</div>
              <div className="text-4xl font-bold text-white">$170M+</div>
              <div className="text-xs text-gray-600 mt-1">  (DefiLlama)</div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
              <div className="text-xs text-gray-500 uppercase mb-2">Blend Protocol TVL</div>
              <div className="text-4xl font-bold text-white">$88-90M</div>
              <div className="text-xs text-gray-600 mt-1">Largest lending protocol</div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
              <div className="text-xs text-gray-500 uppercase mb-2">Aquarius TVL</div>
              <div className="text-4xl font-bold text-white">$40M</div>
              <div className="text-xs text-gray-600 mt-1">AMM & liquidity</div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:col-span-2">
              <div className="text-xs text-gray-500 uppercase mb-3">Example Yields (Variable)</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Blend collateral supply</span>
                  <span className="font-mono font-bold text-white">6-18%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Aquarius LP pools</span>
                  <span className="font-mono font-bold text-white">Up to 30%+</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#FF0055] to-[#cc0044] text-white rounded-2xl p-6">
              <div className="text-xs  mb-2 opacity-90">pegaso on Stellar Testnet</div>
              <div className="text-sm font-mono leading-relaxed">
                ✓ Blend integration live<br />
                ✓ Real protocol rates<br />
                ⏳ Aquarius coming soon
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* --- VISION & ROADMAP SECTION --- */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Vision */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tighter mb-6">Why pegaso?</h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  Stellar excels at fast, low-cost value transfer — but DeFi participation is still fragmented. Users want simple access to the best yields without jumping between dApps and jargon.
                </p>
                <p className="text-white font-bold text-lg">
                  pegaso is the connector :<br />
                  One app → multiple protocols → user control.
                </p>

              </div>
            </div>

            {/* Roadmap */}
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight mb-6 text-[#2DD4BF]">Roadmap</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#2DD4BF] mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-bold text-white">MVP (Now)</div>
                    <div className="text-sm text-gray-400">Blend integration + share system (testnet live)</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-bold text-white">Q1 2026</div>
                    <div className="text-sm text-gray-400">Add Aquarius liquidity + Defindex vaults; user allocation UI</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#FF0055] mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-bold text-white">Q2 2026</div>
                    <div className="text-sm text-gray-400">Auto-compounding harvests (optional reinvest)</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-gray-600 mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-bold text-white">Future</div>
                    <div className="text-sm text-gray-400">More protocols (Soroswap, FxDAO…), risk-tranched options, governance</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3 text-xs font-mono uppercase">
                <span className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg">Open-source</span>
                <span className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg">Auditable</span>
                <span className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg">Community-driven</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- INTEGRATED PROTOCOLS SECTION --- */}
      <section id="protocols" className="bg-[#0a0a0a] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tighter mb-12">Integrated Protocols</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Blend */}
            <div className="bg-[#111] border border-[#9333EA]/30 rounded-2xl p-8 hover:border-[#9333EA] transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#9333EA]/20 flex items-center justify-center">
                  <TrendingUp className="text-[#9333EA]" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Blend</h3>
                  <span className="text-xs text-[#2DD4BF] font-mono uppercase">✓ Live (Stellar Testnet)</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Collateral lending & stable yields
              </p>
            </div>

            {/* Aquarius */}
            <div className="bg-[#111] border border-[#2DD4BF]/30 rounded-2xl p-8 hover:border-[#2DD4BF] transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#2DD4BF]/20 flex items-center justify-center">
                  <Globe className="text-[#2DD4BF]" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Aquarius</h3>
                  <span className="text-xs text-gray-500 font-mono uppercase">Coming Q1</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                AMM liquidity & bribe-boosted returns
              </p>
            </div>

            {/* Defindex */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Coins className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Defindex</h3>
                  <span className="text-xs text-gray-500 font-mono uppercase">Coming Q1</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Diversified vault strategies
              </p>
            </div>

          </div>

          <p className="text-center text-gray-500 font-mono text-sm mt-12">
            More coming. <span className="text-white">You decide where your capital works hardest.</span>
          </p>
        </div>
      </section>

      {/* --- FINAL CTA SECTION --- */}
      <section className="px-4 sm:px-6 py-24 sm:py-32">
        <div className="max-w-[1400px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter">
              Start YieldMaxxing on<br />Stellar Today
            </h2>

            <p className="text-gray-400 font-mono text-sm sm:text-base max-w-2xl mx-auto">
              Connect your wallet and deposit on testnet.<br />
              See how easy multi-protocol yields can be.
            </p>

            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isConnected ? () => navigate('/dashboard') : handleConnectClick}
                className="cursor-pointer group relative px-8 sm:px-12 py-4 sm:py-6 bg-white text-black rounded-full overflow-hidden"
              >
                <span className="relative z-10 text-base sm:text-xl font-black uppercase flex items-center gap-2">
                  {isConnected ? 'Launch App' : 'Connect Wallet'}
                </span>
                <div className="absolute inset-0 bg-[#2DD4BF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              </motion.button>

            </div>


          </motion.div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-8 sm:py-12 border-t border-white/10 px-4 sm:px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tighter mb-2">pegaso</h2>

          </div>
          <div className="flex gap-6 sm:gap-8 font-mono text-xs text-gray-400">
            <a href="https://x.com/pegaso_vault" target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-white transition-colors">TWITTER</a>
            <a href="#" className="cursor-pointer hover:text-white transition-colors">GITHUB</a>
            <a href="#" className="cursor-pointer hover:text-white transition-colors">DISCORD</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
