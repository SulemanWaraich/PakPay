import { Button } from "./Button";
import Link from "next/link"

interface AppbarProps {
    user?: {
        name?: string | null;
    },
    // TODO: can u figure out what the type should be here?
    onSignin: any,
    onSignout: any
}

export const Appbar = ({
    user,
    onSignin,
    onSignout
}: AppbarProps) => {
    return <div className="flex justify-between border-b px-4 bg-white text-black">
        <div className="sm:text-3xl text-2xl font-bold text-green-600 mt-2">
            <Link href={'/'}>
            
            PakPay
            </Link>
            </div>
        <div className="flex flex-col justify-center pt-2">
            <Button onClick={user ? onSignout : onSignin}>{user ? "Logout" : "Login"}</Button>
        </div>
    </div>
}