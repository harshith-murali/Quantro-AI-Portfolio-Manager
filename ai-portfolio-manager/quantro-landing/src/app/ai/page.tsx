"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Bot, 
  ArrowRight, 
  Search, 
  Send, 
  X,
  Target,
  Zap,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import MarkdownView from "@/components/MarkdownView";

// Restore UI constants
const SECTOR_COLORS: Record<string,string> = {
  Technology:"text-blue-400",  Banking:"text-emerald-400",
  Energy:"text-gold",          FMCG:"text-purple-400",
  Pharma:"text-pink-400",      Finance:"text-cyan-400",
  Auto:"text-orange-400",      Industrial:"text-yellow-400",
};

const CONVICTION: Record<string,{label:string;color:string}> = {
  "HIGH": {label:"High",  color:"text-emerald-400"},
  "MEDIUM": {label:"Medium",color:"text-gold"},
  "LOW": {label:"Low",   color:"text-white/50"},
  // Fallbacks for numbers or mixed cases
  "3": {label:"High",  color:"text-emerald-400"},
  "2": {label:"Medium",color:"text-gold"},
  "1": {label:"Low",   color:"text-white/50"},
};

// Rec type remains same
type Rec = {
  symbol: string; sector: string; price: number;
  qty: number; totalCost: number; conviction: number;
  rationale: string; tag: string;
};

export default function AIAdvisorPage() {
  const accessToken = useAuth();
  const { user } = useStore();
  const [holdings,  setHoldings]  = useState<any[]>([]);
  const [balance,   setBalance]   = useState(0);
  const [recs,      setRecs]      = useState<Rec[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [question,  setQuestion]  = useState("");
  const [askResult, setAskResult] = useState("");
  const [asking,    setAsking]    = useState(false);
  const [activeRec, setActiveRec] = useState<Rec|null>(null);
  const [buyMsg,    setBuyMsg]    = useState("");
  const [buyErr,    setBuyErr]    = useState("");
  const [buyQty,    setBuyQty]    = useState("");
  const [buying,    setBuying]    = useState(false);
  const [enquiry,   setEnquiry]   = useState("");
  const [enqResult, setEnqResult] = useState("");
  const [enquiring, setEnquiring] = useState(false);

  const riskAppetite = (user as any)?.riskAppetite ?? "MEDIUM";
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    Promise.allSettled([
      api.portfolio.holdings(accessToken).then((d:any) => setHoldings(d.holdings ?? d ?? [])).catch(()=>{}),
      api.wallet.balance(accessToken).then((d:any) => setBalance(Number(d.balance??0))).catch(()=>{}),
    ]).finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (accessToken && !loading) fetchRecommendations();
  }, [accessToken, loading]);

  const fetchRecommendations = async () => {
    if (!accessToken || recsLoading) return;
    setRecsLoading(true);
    setRecsError("");
    try {
      const d = await api.insights.recommendations(accessToken);
      if (d.recommendations) {
        const holdingSymbols = new Set(holdings.map((h: any) => h.symbol));
        const filteredRecs = d.recommendations.filter((r: any) => !holdingSymbols.has(r.symbol));
        setRecs(filteredRecs.map((r: any) => ({
          ...r,
          totalCost: r.qty * r.price,
        })));
      }
    } catch (e: any) {
      console.error("Failed to fetch recommendations:", e);
      setRecsError(e.message || "Failed to fetch AI recommendations.");
    } finally {
      setRecsLoading(false);
    }
  };

  const fetchPortfolioInsight = async () => {
    if (!accessToken || aiLoading) return;
    setAiLoading(true); setAiInsight("");
    try {
      const d = await api.insights.portfolioSummary(accessToken);
      setAiInsight((d as any).insight ?? (d as any).response ?? "");
    } catch { setAiInsight("AI insight unavailable — backend may be offline."); }
    finally { setAiLoading(false); }
  };

  const handleAsk = async () => {
    if (!accessToken || !question.trim() || asking) return;
    setAsking(true); setAskResult("");
    try {
      const d = await api.insights.ask(question, accessToken);
      setAskResult((d as any).insight ?? (d as any).response ?? "");
    } catch { setAskResult("Unable to reach AI advisor right now."); }
    finally { setAsking(false); }
  };

  const handleBuy = async () => {
    if (!accessToken || !activeRec || !buyQty) return;
    setBuying(true); setBuyMsg(""); setBuyErr("");
    try {
      await api.portfolio.trade({ symbol: activeRec.symbol, action:"BUY", quantity: Number(buyQty) }, accessToken);
      setBuyMsg(`Order successful: ${buyQty} × ${activeRec.symbol}`);
      setTimeout(() => { 
        setActiveRec(null); 
        setBuyMsg(""); 
        setBuyQty(""); 
        setRecs(prev => prev.filter(r => r.symbol !== activeRec.symbol));
        Promise.allSettled([
          api.portfolio.holdings(accessToken).then((d:any) => setHoldings(d.holdings ?? d ?? [])),
          api.wallet.balance(accessToken).then((d:any) => setBalance(Number(d.balance??0)))
        ]);
      }, 1800);
    } catch(e:any) { setBuyErr(e.message ?? "Trade failed"); }
    finally { setBuying(false); }
  };

  const handleEnquire = async () => {
    if (!accessToken || !enquiry.trim() || enquiring) return;
    setEnquiring(true); setEnqResult("");
    try {
      const d = await api.insights.stock(enquiry.toUpperCase(), accessToken);
      setEnqResult((d as any).insight ?? (d as any).response ?? "");
    } catch { setEnqResult("Unable to fetch stock enquiry at this time."); }
    finally { setEnquiring(false); }
  };

  const investable = balance * (riskAppetite === "HIGH" ? 0.5 : riskAppetite === "LOW" ? 0.18 : 0.32);
  const totalAllocated = recs.reduce((s,r) => s+r.totalCost, 0);

  if (loading) return (
    <div className="min-h-screen pt-36 pb-24 px-4 max-w-5xl mx-auto animate-pulse">
      <div className="h-10 w-64 bg-white/5 rounded mb-4"/>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_,i)=><div key={i} className="h-24 bg-white/5 rounded-2xl"/>)}
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_,i)=><div key={i} className="h-20 bg-white/5 rounded-2xl"/>)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-36 pb-24 px-4 md:px-8 max-w-5xl mx-auto">

      {/* Header */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="mb-10">
        <p className="text-white/30 text-[10px] uppercase tracking-[0.35em] mb-2">Powered by AI</p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          AI <span className="text-gold">Advisor</span>
        </h1>
        <p className="text-white/40 text-sm">Personalised stock picks based on your wallet, risk profile, and current holdings.</p>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          {label:"Wallet Balance",   value:`₹${balance.toLocaleString("en-IN")}`,        color:"text-white"},
          {label:"Investable Budget", value:`₹${Math.floor(investable).toLocaleString("en-IN")}`, color:"text-gold"},
          {label:"Stocks Suggested", value:String(recs.length),                           color:"text-emerald-400"},
          {label:"Total Allocation", value:`₹${Math.floor(totalAllocated).toLocaleString("en-IN")}`, color: totalAllocated>balance?"text-red-400":"text-emerald-400"},
        ].map(({label,value,color},i)=>(
          <motion.div key={label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
            className="glass-card">
            <p className="text-white/35 text-[10px] uppercase tracking-wider mb-1.5">{label}</p>
            <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recommendations */}
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className="glass-card mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] mb-0.5">AI Recommendations</p>
            <p className="text-white font-semibold">
              {riskAppetite.charAt(0) + riskAppetite.slice(1).toLowerCase()} profile · {recs.length} picks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecommendations}
              disabled={recsLoading}
              className={`p-2 rounded-lg border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all ${recsLoading ? 'opacity-50' : ''}`}
              title="Refresh Recommendations"
            >
              <RefreshCcw size={16} className={recsLoading ? 'animate-spin' : ''} />
            </button>
            <span className="px-3 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-[10px] uppercase tracking-wider font-semibold">
              {riskAppetite}
            </span>
          </div>
        </div>

        {recsLoading ? (
          <div className="py-12 flex flex-col items-center gap-3">
             <div className="flex gap-1.5">
               {[0,1,2].map(i=>(
                 <div key={i} className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>
               ))}
             </div>
             <p className="text-white/30 text-xs">AI is generating your picks…</p>
          </div>
        ) : recsError ? (
          <div className="py-16 text-center">
            <AlertTriangle size={48} className="mx-auto mb-3 text-red-400/50" />
            <p className="text-white/70 text-sm mb-1">AI Advisor Offline</p>
            <p className="text-white/40 text-xs">{recsError}</p>
          </div>
        ) : recs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3 text-white/10">◎</p>
            <p className="text-white/30 text-sm mb-1">Insufficient balance for recommendations</p>
            <p className="text-white/20 text-xs">Deposit funds to your wallet to get AI-powered stock picks</p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 pb-2 border-b border-white/[0.06] mb-1">
              {["Stock","Sector","Price","Qty","Total","Conviction",""].map(h=>(
                <p key={h} className={`text-white/25 text-[9px] uppercase tracking-wider ${h==="Stock"?"col-span-2":h==="Sector"?"col-span-2":h===""?"col-span-1":"col-span-2"} ${h==="Conviction"?"col-span-1":""}`}>{h}</p>
              ))}
            </div>

            {recs.map((r,i)=>{
              const convKey = String(r.conviction).toUpperCase();
              const conv = CONVICTION[convKey] || { label: r.conviction || "Unknown", color: "text-white/50" };
              return (
                <motion.div key={r.symbol}
                  initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:0.05+i*0.04}}
                  className="grid grid-cols-12 gap-2 items-center py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.018] rounded-lg px-1 transition-colors group cursor-default">
                  {/* Symbol + tag */}
                  <div className="col-span-2">
                    <p className="text-white font-bold text-sm">{r.symbol}</p>
                    <span className="text-[9px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">{r.tag}</span>
                  </div>
                  {/* Sector */}
                  <p className={`col-span-2 text-xs ${SECTOR_COLORS[r.sector]??'text-white/50'}`}>{r.sector}</p>
                  {/* Price */}
                  <p className="col-span-2 text-white/70 text-sm tabular-nums">₹{r.price.toLocaleString("en-IN")}</p>
                  {/* Qty */}
                  <p className="col-span-2 text-white font-semibold tabular-nums">{r.qty}</p>
                  {/* Total */}
                  <p className="col-span-2 text-white/60 text-sm tabular-nums">₹{r.totalCost.toLocaleString("en-IN")}</p>
                  {/* Conviction */}
                  <p className={`col-span-1 text-xs font-semibold ${conv.color}`}>{conv.label}</p>
                  {/* Buy btn */}
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={()=>{ setActiveRec(r); setBuyQty(String(r.qty)); setBuyMsg(""); setBuyErr(""); }}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-500/25 transition-all"
                    >Buy</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Rationale accordion */}
        {recs.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-white/25 text-[10px] uppercase tracking-wider mb-3">AI Rationale</p>
            {recs.map(r=>(
              <div key={r.symbol+"rat"} className="flex gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.04]">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-[10px] font-bold shrink-0">
                  {r.symbol.slice(0,2)}
                </div>
                <div>
                  <p className="text-white/70 text-xs font-semibold mb-0.5">{r.symbol}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{r.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Portfolio AI Insight */}
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.22}} className="glass-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] mb-0.5">AI Portfolio Analysis</p>
            <p className="text-white font-semibold text-sm">Full portfolio health check</p>
          </div>
          <button
            onClick={fetchPortfolioInsight}
            disabled={aiLoading}
            className="flex items-center gap-2 px-5 py-2 rounded-full border border-gold/30 text-gold text-xs font-semibold hover:bg-gold/10 transition-all disabled:opacity-40"
          >
            {aiLoading ? <RefreshCcw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{aiLoading ? "Analysing…" : "Run Analysis"}</span>
          </button>
        </div>
        <AnimatePresence>
          {aiInsight && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
              className="mt-4 p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
              <MarkdownView content={aiInsight} />
              <div className="flex items-center gap-2 text-white/20 text-[10px] mt-5 border-t border-white/[0.05] pt-3">
                <AlertTriangle size={10} />
                <span>AI-generated insight. Not financial advice.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!aiInsight && !aiLoading && (
          <div className="py-8 text-center">
            <p className="text-white/20 text-sm">Click "Run Analysis" to get a full AI health check of your portfolio</p>
          </div>
        )}
        {aiLoading && (
          <div className="py-8 flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              {[0,1,2].map(i=>(
                <div key={i} className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>
              ))}
            </div>
            <p className="text-white/30 text-xs">AI is analysing your portfolio…</p>
          </div>
        )}
      </motion.div>

      {/* Stock Enquiry Section */}
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.25}} className="glass-card mb-6">
        <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] mb-4">Stock Specific Enquiry</p>
        <div className="flex gap-3 mb-4">
          <input
            value={enquiry}
            onChange={e=>setEnquiry(e.target.value)}
            onKeyDown={e=>e.key==="Enter" && handleEnquire()}
            placeholder="Enter stock symbol (e.g. RELIANCE, TCS)"
            className="auth-input flex-1 uppercase"
          />
          <button
            onClick={handleEnquire}
            disabled={enquiring || !enquiry.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gold text-[#060606] text-sm font-bold hover:bg-[#e8c97a] transition-all disabled:opacity-40 shrink-0"
          >
            {enquiring ? <RefreshCcw size={16} className="animate-spin" /> : <Search size={16} />}
            <span>{enquiring ? "" : "Enquire"}</span>
          </button>
        </div>
        <AnimatePresence>
          {enqResult && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="p-5 rounded-2xl bg-white/[0.025] border border-gold/10 mt-4">
              <MarkdownView content={enqResult} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Ask AI */}
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.28}} className="glass-card">
        <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] mb-4">Ask AI Advisor</p>
        <div className="flex gap-3 mb-4">
          <input
            value={question}
            onChange={e=>setQuestion(e.target.value)}
            onKeyDown={e=>e.key==="Enter" && handleAsk()}
            placeholder="e.g. Should I buy more TCS? What is my biggest risk?"
            className="auth-input flex-1"
          />
          <button
            onClick={handleAsk}
            disabled={asking || !question.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gold text-[#060606] text-sm font-bold hover:bg-[#e8c97a] transition-all disabled:opacity-40 shrink-0"
          >
            {asking ? <RefreshCcw size={16} className="animate-spin" /> : <Send size={16} />}
            <span>{asking ? "" : "Ask"}</span>
          </button>
        </div>
        {/* Quick prompts */}
        <div className="flex gap-2 flex-wrap mb-4">
          {["What should I buy next?","Am I over-exposed to one sector?","What is my risk level?","Best defensive stocks?"].map(q=>(
            <button key={q} onClick={()=>setQuestion(q)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/40 text-xs hover:text-white hover:border-white/20 transition-all group">
              <MessageSquare size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
              <span>{q}</span>
            </button>
          ))}
        </div>
        <AnimatePresence>
          {askResult && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="p-4 rounded-2xl bg-white/[0.025] border border-gold/10">
              <p className="text-gold text-[10px] uppercase tracking-wider mb-2 flex items-center gap-2">
                <BrainCircuit size={14} /> AI Response
              </p>
              <MarkdownView content={askResult} />
              <div className="flex items-center gap-2 text-white/20 text-[10px] mt-4 border-t border-white/[0.05] pt-3">
                <AlertTriangle size={10} />
                <span>AI-generated response. Verify all market data independently.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Buy Modal */}
      <AnimatePresence>
        {activeRec && (
          <motion.div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={e=>{if(e.target===e.currentTarget){setActiveRec(null);}}}>
            <motion.div className="glass-card w-full max-w-sm rounded-3xl"
              initial={{y:50,opacity:0}} animate={{y:0,opacity:1}} exit={{y:50,opacity:0}}
              transition={{type:"spring",damping:24,stiffness:280}}>
              <div className="flex justify-between items-start mb-5">
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-[0.25em] mb-0.5">AI Recommended Buy</p>
                  <h2 className="text-2xl font-bold text-emerald-400">{activeRec.symbol}</h2>
                  <p className="text-white/40 text-xs">{activeRec.sector} · ₹{activeRec.price.toLocaleString("en-IN")}/share</p>
                </div>
                <button onClick={()=>setActiveRec(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 mb-5">
                <p className="text-emerald-400/70 text-xs leading-relaxed">{activeRec.rationale}</p>
              </div>

              <div className="mb-5">
                <label className="field-label">Quantity</label>
                <input
                  type="number" min={1} value={buyQty}
                  onChange={e=>setBuyQty(e.target.value)}
                  className="auth-input"
                />
                <p className="text-white/25 text-xs mt-1.5">
                  Est. cost: ₹{(Number(buyQty||0)*activeRec.price).toLocaleString("en-IN")} · Wallet: ₹{balance.toLocaleString("en-IN")}
                </p>
              </div>

              {buyMsg && <p className="flex items-center justify-center gap-2 text-emerald-400 text-sm text-center mb-3"><CheckCircle2 size={16} /> {buyMsg}</p>}
              {buyErr && <p className="text-red-400 text-sm text-center mb-3">{buyErr}</p>}

              <button onClick={handleBuy} disabled={buying||!buyQty}
                className="w-full py-4 rounded-full bg-emerald-500 text-black font-bold text-sm uppercase tracking-[0.15em] hover:bg-emerald-400 hover:-translate-y-0.5 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {buying ? <RefreshCcw size={18} className="animate-spin" /> : <Zap size={18} />}
                <span>{buying ? "Placing order…" : `Buy ${buyQty||"?"} × ${activeRec.symbol}`}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
