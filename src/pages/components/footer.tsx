import Link from "next/link";
import { FiGithub } from "react-icons/fi";
import { LiaSignOutAltSolid } from "react-icons/lia";
import { SignOutButton } from "@clerk/nextjs";
const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 z-20 w-full border-t border-gray-200 bg-white/30  p-4 shadow backdrop-blur-sm dark:border-gray-600 dark:bg-gray-800 md:flex md:items-center md:justify-between md:p-6">
      <div className="flex gap-3">
        <Link href={"https://github.com/ayofimihan/tee3"}>
          <FiGithub size={20} />
        </Link>
        <SignOutButton>
          <button>
            {" "}
            <LiaSignOutAltSolid size={20} />
          </button>
        </SignOutButton>
      </div>

      <ul className="mt-3 flex flex-wrap items-center text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
        <div>
          built by{" "}
          <Link
            href={"https://github.com/ayofimihan"}
            className="text-blue-400 hover:underline"
          >
            Champion
          </Link>
        </div>
      </ul>
    </footer>
  );
};

export default Footer;
