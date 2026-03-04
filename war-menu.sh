#!/bin/bash
# War Room — Daily Operations Menu
# Run: ./war-menu.sh or double-click "War Room.command"

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[1;33m'
BLU='\033[0;34m'
CYN='\033[0;36m'
MAG='\033[0;35m'
WHT='\033[1;37m'
DIM='\033[2m'
RST='\033[0m'

WD="$HOME/Library/Mobile Documents/com~apple~CloudDocs/War monitor"
cd "$WD" || exit 1

clear
echo ""
echo -e "${RED}╔══════════════════════════════════════════════════════╗${RST}"
echo -e "${RED}║${WHT}         ⚔  WAR ROOM — DAILY OPERATIONS  ⚔           ${RED}║${RST}"
echo -e "${RED}║${DIM}         war-room.live · $(date '+%d %b %Y %H:%M UTC')         ${RED}║${RST}"
echo -e "${RED}╚══════════════════════════════════════════════════════╝${RST}"
echo ""
echo -e "${WHT}  DAILY MONITORING${RST}"
echo -e "${GRN}   1)${RST} Update dashboard data (stats, markets, events)"
echo -e "${GRN}   2)${RST} Add new events to event log"
echo -e "${GRN}   3)${RST} Update ticker with breaking news"
echo -e "${GRN}   4)${RST} Update Kahn escalation level"
echo -e "${GRN}   5)${RST} Audit all data for accuracy"
echo ""
echo -e "${WHT}  DEPLOY & DEVELOP${RST}"
echo -e "${BLU}   6)${RST} Open dashboard in browser"
echo -e "${BLU}   7)${RST} Commit & push to Vercel"
echo -e "${BLU}   8)${RST} View git log"
echo -e "${BLU}   9)${RST} Deploy CF Workers (market + events)"
echo ""
echo -e "${WHT}  PAGES${RST}"
echo -e "${YLW}  10)${RST} Open landing page"
echo -e "${YLW}  11)${RST} Open pricing page"
echo -e "${YLW}  12)${RST} Open conflict SEO page"
echo -e "${YLW}  13)${RST} Open embed widget"
echo ""
echo -e "${WHT}  GROWTH & MARKETING${RST}"
echo -e "${MAG}  14)${RST} View distribution posts"
echo -e "${MAG}  15)${RST} View Twitter/X strategy"
echo -e "${MAG}  16)${RST} View newsletter strategy"
echo -e "${MAG}  17)${RST} View competitive analysis"
echo ""
echo -e "${WHT}  ARCHITECTURE${RST}"
echo -e "${CYN}  18)${RST} View API spec"
echo -e "${CYN}  19)${RST} View roadmap"
echo -e "${CYN}  20)${RST} Open Claude agent"
echo -e "${CYN}  21)${RST} Vercel dashboard"
echo -e "${CYN}   0)${RST} Exit"
echo ""
echo -e -n "${WHT}  Select: ${RST}"
read -r choice

case $choice in
  1) echo -e "\n${GRN}Opening Claude for data update...${RST}"
     claude "Read index.html, then I'll give you updated stats/markets/events to apply." ;;
  2) echo -e "\n${GRN}Opening Claude for events...${RST}"
     claude "Read index.html. I'll give you new events to add to the EVS_I18N array." ;;
  3) echo -e "\n${GRN}Opening Claude for ticker...${RST}"
     claude "Read index.html. I'll give you breaking news for the ticker." ;;
  4) echo -e "\n${GRN}Opening Claude for Kahn update...${RST}"
     claude "Read index.html Kahn section. I'll tell you the new escalation level." ;;
  5) echo -e "\n${GRN}Running full audit...${RST}"
     claude "Read index.html. Audit ALL factual claims against the CLAUDE.md audit checklist. Report any unverified data." ;;
  6) open index.html ;;
  7) echo -e "\n${YLW}Staging files...${RST}"
     git add -A
     git status --short
     echo -n "Commit message: " && read -r msg
     git commit -m "$msg"
     git push
     echo -e "${GRN}Deployed! Vercel auto-builds in ~30s${RST}" ;;
  8) git log --oneline -15 ;;
  9) echo -e "\n${BLU}Deploy workers:${RST}"
     echo "  cd workers/market-proxy && wrangler deploy"
     echo "  cd workers/event-ingest && wrangler deploy"
     echo -e "\n${DIM}Run these manually after 'wrangler login'${RST}" ;;
  10) open landing.html ;;
  11) open pricing.html ;;
  12) open conflicts/iran-usa-israel-2026.html ;;
  13) open embed.html ;;
  14) cat distribution/posts.md | less ;;
  15) cat distribution/twitter-strategy.md | less ;;
  16) cat distribution/newsletter-strategy.md | less ;;
  17) cat distribution/competitive-analysis.md | less ;;
  18) cat architecture/api-spec.md | less ;;
  19) cat ~/.claude/projects/-Users-nelsonperez-Library-Mobile-Documents-com-apple-CloudDocs-War-monitor/memory/roadmap.md ;;
  20) claude ;;
  21) open "https://vercel.com/dashboard" ;;
  0) echo -e "${DIM}Bye.${RST}"; exit 0 ;;
  *) echo -e "${RED}Invalid option${RST}"; exit 1 ;;
esac

echo ""
echo -e "${DIM}Press any key to return...${RST}"
read -rn1
exec "$0"
