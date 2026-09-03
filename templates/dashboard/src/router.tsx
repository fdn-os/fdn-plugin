import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import * as stylex from "@stylexjs/stylex";
import { darkTheme, tokens } from "./tokens.stylex";
import { NavBar, ToastProvider, useTheme } from "./components/ui";
import { DashboardPage } from "./routes/dashboard";

const styles = stylex.create({
  shell: { minHeight: "100vh", backgroundColor: tokens.bg, color: tokens.text, fontFamily: tokens.fontSans },
  main: { paddingInline: 20, paddingBlock: 24, maxWidth: 1200, marginInline: "auto" },
});

function RootLayout() {
  // ONE layout for the whole app: the nav is defined here, once, and every route renders inside it.
  // Never give a route its own header — a page without the shared nav is a dead end.
  const { theme, pref, setPref } = useTheme();
  return (
    <div {...stylex.props(styles.shell, theme === "dark" && darkTheme)}>
      <ToastProvider>
        <NavBar links={[{ to: "/", label: "Overview", exact: true }]} account={{ pref, onPrefChange: setPref }} />
        <main {...stylex.props(styles.main)}><Outlet /></main>
      </ToastProvider>
    </div>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });
const dashRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: DashboardPage });
const routeTree = rootRoute.addChildren([dashRoute]);

export const router = createRouter({ routeTree });
