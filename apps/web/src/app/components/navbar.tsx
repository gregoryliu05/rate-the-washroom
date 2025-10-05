import Link from "next/link"
import ProfileIcon from "./profileicon"

export default function Navbar() {
    return (
        <nav className="navbar w-85/100 bg-gray-100 p-5 grid grid-cols-[1fr_auto_1fr] items-center ">
            <Link href="/" className="bg-green-200 text-xl font-bold flex justify-self-start">
                Poop Map
            </Link>
            <div className="nav-container bg-red-400 gap-6 text-2xl flex justify-center items-center">
                <Link href="/">Home</Link>
                <Link href="/add-listing">Add Listing</Link>
                <Link href="/add-review">Add Review</Link>
                <Link href="/login">Login</Link>
            </div>
            <div className="justify-self-end">
                <ProfileIcon />
            </div>
        </nav>
    )
}
