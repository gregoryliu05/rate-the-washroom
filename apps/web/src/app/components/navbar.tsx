import Link from "next/link"

export default function Navbar() {
    return (
        <nav className="navbar">
            <div className="nav-container flex-cols text-2xl bg-blue-700 flex justify-center items-center">
                <Link href="/">Home</Link>
                <Link href="/login">Login</Link>
            </div>
        </nav>
    )
}
