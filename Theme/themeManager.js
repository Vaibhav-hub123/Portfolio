const themes = {
  blue: {
    primary: "#00d8ff",
    secondary: "#0077ff", // keep if you still want it for something separate; not used below
    white: "#ffffff",
    
    glass: "rgba(0,180,220,.08)",
    border: "rgba(0,221,255,.35)",

    panelLeft: "rgba(0,140,180,.25)",
    panelMiddle: "rgba(0,200,240,.10)",
    panelRight: "rgba(0,140,180,.25)",

    glowSoft: "rgba(0,221,255,.35)",
    glowMedium: "rgba(0,221,255,.60)",
    glowStrong: "rgba(0,221,255,.70)",

    blueSoft: "rgba(0,200,240,.25)",
    blueMedium: "rgba(0,200,240,.30)",
    blueStrong: "rgba(0,200,240,.45)",
  },

  green: {
    primary: "#00ff99",
    secondary: "#00cc77",
    white: "#ffffff",
     
    glass: "rgba(0,255,140,.08)",
    border: "rgba(0,255,140,.35)",

    panelLeft: "rgba(0,120,70,.25)",
    panelMiddle: "rgba(0,255,150,.10)",
    panelRight: "rgba(0,120,70,.25)",

    glowSoft: "rgba(0,255,140,.35)",
    glowMedium: "rgba(0,255,140,.60)",
    glowStrong: "rgba(0,255,140,.70)",

    blueSoft: "rgba(0,200,120,.25)",
    blueMedium: "rgba(0,200,120,.30)",
    blueStrong: "rgba(0,200,120,.45)",
  },
  red: {
    primary: "#ff5b5b",
    secondary: "#ff2f2f",
    white: "#ffffff",
   
    glass: "rgba(255,70,70,.08)",
    border: "rgba(255,90,90,.35)",

    panelLeft: "rgba(120,20,20,.25)",
    panelMiddle: "rgba(255,60,60,.10)",
    panelRight: "rgba(120,20,20,.25)",

    glowSoft: "rgba(255,90,90,.35)",
    glowMedium: "rgba(255,90,90,.60)",
    glowStrong: "rgba(255,90,90,.75)",

    blueSoft: "rgba(255,40,40,.25)",
    blueMedium: "rgba(255,40,40,.35)",
    blueStrong: "rgba(255,40,40,.50)",
  },
};

export function applyTheme(name) {
  const theme = themes[name];
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--white", theme.white);
  root.style.setProperty("--glass", theme.glass);
  root.style.setProperty("--border", theme.border);
  root.style.setProperty("--panel-left", theme.panelLeft);
  root.style.setProperty("--panel-middle", theme.panelMiddle);
  root.style.setProperty("--panel-right", theme.panelRight);
  root.style.setProperty("--glow-soft", theme.glowSoft);
  root.style.setProperty("--glow-medium", theme.glowMedium);
  root.style.setProperty("--glow-strong", theme.glowStrong);
  root.style.setProperty("--blue-soft", theme.blueSoft);
  root.style.setProperty("--blue-medium", theme.blueMedium);
  root.style.setProperty("--blue-strong", theme.blueStrong);
}

export { themes };
