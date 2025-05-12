import { accounts } from "../lib/accounts";
import { from } from "solid-js";
import User from "./User";
import { Button } from "./ui/button";
import CreateCampaign from "./CreateCampaign";
import SignInDialog from "./SignInDialog";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const account = from(accounts.active$);

  return (
    <nav class="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-12 items-center">
          <div class="flex justify-start items-center">
            <div class="flex-shrink-0">
              <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100 mr-4">
                Loudr
              </h1>
            </div>
            <div class="flex gap-4">
              {account() !== undefined ? <CreateCampaign /> : ""}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <ThemeToggle />
            {account() === undefined ? (
              <SignInDialog>
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              </SignInDialog>
            ) : (
              <div class="flex items-center gap-4">
                <User />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
