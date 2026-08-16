import { createBrowserRouter, RouterProvider } from "react-router"
import Protected from "./components/Layout/protected-route"
import LoginPage from "./features/auth/login"
import { GuestRoute } from "./components/Layout/guest-route"
import Layout from "./components/Layout/app-layout"
import TerminalPage from "./features/terminal/terminalPage"
import GlobalErrorPage from "./components/Layout/global-error-page"
import { SessionsPage } from "./features/sessions/sessionsPage"
import UsersPage from "./features/members/add-users-page"
import GroupsPage from "./features/groups/groups-page"
import ServersPage from "./features/servers/servers"
import DashboardPage from "./features/dashboard/dashboard"
import SetupRoute from "./components/Layout/setup-route"
import SetupPage from "./features/auth/setup"

function App() {

  const router = createBrowserRouter([
    {
      element: <Protected />,
      children: [
        {
          element: <Layout />,
          children: [
            {
              path: "/",
              element: <DashboardPage />
            },
            {
              path: "/servers/:id/terminal",
              element: <TerminalPage />
            },
            {
              path: "/sessions",
              element: <SessionsPage />
            },
            {
              path: "/servers",
              element: <ServersPage />
            },
            {
              path: "/members",
              element: <UsersPage />
            },
            {
              path: "/groups",
              element: <GroupsPage />
            }
          ]
        }
      ]
    },
    {
      element: <SetupRoute />,
      children: [
        {
          path: "/setup",
          element: <SetupPage />
        }
      ]
    },
    {
      element: <GuestRoute />,
      children: [
        {
          path: "/login",
          element: <LoginPage />
        }
      ]
    },
    {
      path: "*",
      element: <GlobalErrorPage status={404} />,
    }
  ])

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
