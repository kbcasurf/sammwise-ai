import Image from "next/image"

const Footer = () => {
    return (
        <footer>
            <a href="https://owasp.org/">
                <Image
                    src ="/Footer.png"
                    alt ="OWASP"
                    width = {300}
                    height={100}
                    style={{
                        maxWidth: "100%",
                        height: "auto"
                    }} />
            </a>
        </footer>
    );
}
 
export default Footer;
