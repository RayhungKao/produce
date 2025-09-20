import styles from "./index.module.scss";
import Link from "next/link";

export default function Navigation() {
  return (
    <div className={styles.container}>
      <Link href="/" className={styles.logo}>
        <img src="/assets/images/logo/logo.svg" width={80} height={40} />
      </Link>
      <div className={styles.name}>JuiHung Kao</div>
    </div>
  );
}
