import Link from 'next/link'
import Image from "next/image"


const Navbar = () => {
    return (
        <nav>
            <div className = "logo">
                <Image
                    src = "/logo.png"
                    alt = "SAMMWise"
                    width = {77}
                    height = {77}
                    style={{
                        maxWidth: "100%",
                        height: "auto"
                    }} />
            </div>
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/assessment">Assessment</Link>
            <Link href="/results">Results</Link>
            <Link href="/history">History</Link>
        </nav>
    );
}
 
export default Navbar
