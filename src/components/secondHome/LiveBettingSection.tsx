import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import type { LiveBettingSection as LiveBettingSectionType } from "@/hooks/useSecondHomePageData";

interface LiveBettingSectionProps {
  section: LiveBettingSectionType;
}

const ODDS_COLUMNS = 3;

export function LiveBettingSection({ section }: LiveBettingSectionProps) {
  const { title, events } = section;
  if (!events.length) return null;
  return (
    <section className="container px-4 py-6">
      <h2 className="font-display font-bold text-xl mb-3 text-foreground">{title}</h2>
      <div className="overflow-x-auto rounded-lg glass border border-white/10">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="bg-card/60 border-b border-white/10">
              <th className="text-left font-semibold text-foreground p-3 w-10"></th>
              <th className="text-left font-semibold text-foreground p-3">Match</th>
              <th className="text-left font-semibold text-foreground p-3 w-20">Time</th>
              <th className="text-left font-semibold text-muted-foreground p-3 w-16 text-center">Live</th>
              {Array.from({ length: ODDS_COLUMNS }, (_, i) => (
                <th key={i} className="text-center font-semibold text-foreground p-3 w-14">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((ev, rowIndex) => (
              <tr
                key={ev.id}
                className={`border-b border-white/10 last:border-b-0 ${
                  rowIndex % 2 === 0 ? "bg-card" : "bg-white/5"
                }`}
              >
                <td className="p-2">
                  <Link to="/games">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground h-7 text-xs">
                      <Play className="h-3 w-3 mr-0.5" />
                      Play
                    </Button>
                  </Link>
                </td>
                <td className="p-3">
                  <p className="font-semibold text-foreground truncate max-w-[180px]">
                    {ev.team1} vs. {ev.team2}
                  </p>
                  <p className="text-xs text-muted-foreground">{ev.date}</p>
                </td>
                <td className="p-3 text-muted-foreground">{ev.time}</td>
                <td className="p-3 text-center">
                  {ev.isLive ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-primary/20 text-primary">
                      Live
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                {Array.from({ length: ODDS_COLUMNS }, (_, j) => (
                  <td key={j} className="p-2 text-center">
                    {ev.odds[j] != null ? (
                      <span
                        className={`inline-block text-xs font-semibold px-2 py-1 rounded text-white min-w-[2.5rem] ${
                          j === 0 ? "odds-cell-red" : "odds-cell-blue"
                        }`}
                      >
                        {ev.odds[j]}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
