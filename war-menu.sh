#!/bin/bash
# War Room — Daily Operations Menu
# Run: ./war-menu.sh or double-click War Room.command

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[1;33m'
BLU='\033[0;34m'
CYN='\033[0;36m'
MAG='\033[0;35m'
WHT='\033[1;37m'
DIM='\033[2m'
RST='\033[0m'

clear
echo ""
echo -e "${RED}╔══════════════════════════════════════════════════════╗${RST}"
echo -e "${RED}║${WHT}         ⚔  WAR ROOM — DAILY OPERATIONS  ⚔           ${RED}║${RST}"
echo -e "${RED}║${DIM}         war-room.live · $(date '+%d %b %Y %H:%M UTC')         ${RED}║${RST}"
echo -e "${RED}╚══════════════════════════════════════════════════════╝${RST}"
echo ""
echo -e "${WHT}  DAILY MONITORING${RST}"
echo -e "${GRN}  1)${RST} Update dashboard data (stats, markets, events)"
echo -e "${GRN}  2)${RST} Add new events to event log"
echo -e "${GRN}  3)${RST} Update ticker with breaking news"
echo -e "${GRN}  4)${RST} Update Kahn escalation level"
echo -e "${GRN}  5)${RST} Audit all data for accuracy"
echo ""
echo -e "${WHT}  DEVELOPMENT${RST}"
echo -e "${BLU}  6)${RST} Open in browser (preview)"
echo -e "${BLU}  7)${RST} Commit & deploy to Vercel"
echo -e "${BLU}  8)${RST} View git log"
echo ""
echo -e "${WHT}  ROADMAP — FASE 1: VALIDATE & POSITION${RST}"
echo -e "${YLW}  9)${RST} Analytics setup (GA4 + events)"
echo -e "${YLW} 10)${RST} Competitive analysis"
echo -e "${YLW} 11)${RST} Landing page + waitlist"
echo -e "${YLW} 12)${RST} Distribution (Reddit/X/HN)"
echo ""
echo -e "${WHT}  ROADMAP — FASE 2: DATA MOAT${RST}"
echo -e "${MAG} 13)${RST} Auto-ingestion pipeline"
echo -e "${MAG} 14)${RST} Real market data feed"
echo -e "${MAG} 15)${RST} Auto-verification system"
echo -e "${MAG} 16)${RST} Multi-theater expansion"
echo ""
echo -e "${WHT}  TOOLS${RST}"
echo -e "${CYN} 17)${RST} Open Claude agent in project"
echo -e "${CYN} 18)${RST} View roadmap"
echo -e "${CYN} 19)${RST} View Vercel dashboard"
echo -e "${CYN}  0)${RST} Exit"
echo ""
echo -e -n "${WHT}  Select: ${RST}"
read -r choice

WD="$HOME/Library/Mobile Documents/com~apple~CloudDocs/War monitor"
cd "$WD" || exit 1

case $choice in
  1) echo -e "\n${GRN}Opening Claude agent for data update...${RST}"
     claude "Read index.html, then I'll give you updated stats/markets/events to apply." ;;
  2) echo -e "\n${GRN}Opening Claude agent for events...${RST}"
     claude "Read index.html. I'll give you new events to add to the EVS_I18N array." ;;
  3) echo -e "\n${GRN}Opening Claude agent for ticker...${RST}"
     claude "Read index.html. I'll give you breaking news for the ticker." ;;
  4) echo -e "\n${GRN}Opening Claude agent for Kahn update...${RST}"
     claude "Read index.html Kahn section. I'll tell you the new escalation level." ;;
  5) echo -e "\n${GRN}Running full audit...${RST}"
     claude "Read index.html. Audit ALL factual claims against the CLAUDE.md audit checklist. Report any unverified data." ;;
  6) open index.html ;;
  7) echo -e "\n${YLW}Committing and pushing...${RST}"
     git add index.html CLAUDE.md
     echo -n "Commit message: " && read -r msg
     git commit -m "$msg"
     git push
     echo -e "${GRN}Deployed! Vercel auto-builds in ~30s${RST}" ;;
  8) git log --oneline -15 ;;
  9) claude "Help me set up GA4 analytics for war-room.live. Read index.html first." ;;
  10) claude "Do a competitive analysis of: Janes, Stratfor, Bloomberg Terminal, Liveuamap. Compare features, pricing, audiences." ;;
  11) claude "Help me create a landing page with waitlist for war-room.live." ;;
  12) claude "Help me write distribution posts for Reddit (r/geopolitics, r/OSINT), Twitter/X, and HackerNews for war-room.live." ;;
  13) claude "Design an auto-ingestion pipeline for Reuters, Al Jazeera, Pentagon, CENTCOM feeds." ;;
  14) claude "Design a real-time market data integration using Alpha Vantage or Yahoo Finance API." ;;
  15) claude "Design an auto-verification system with source + timestamp + confidence scoring." ;;
  16) claude "Plan multi-theater expansion (Ukraine, Taiwan, Sudan) for the war room dashboard." ;;
  17) claude ;;
  18) cat ~/.claude/projects/-Users-nelsonperez-Library-Mobile-Documents-com-apple-CloudDocs-War-monitor/memory/roadmap.md ;;
  19) open "https://vercel.com/dashboard" ;;
  0) echo -e "${DIM}Bye.${RST}"; exit 0 ;;
  *) echo -e "${RED}Invalid option${RST}"; exit 1 ;;
esac

echo ""
echo -e "${DIM}Press any key to return...${RST}"
read -rn1
exec "$0"
