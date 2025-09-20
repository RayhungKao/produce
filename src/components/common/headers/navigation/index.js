import styles from "./index.module.scss";

export default function Navigation() {
  return (
    <div className={styles.container}>
      <div>
        <img src="/assets/images/logo/logo.svg" width={80} height={40} />
      </div>
      <div className={styles.name}>Jui Hung Kao</div>
    </div>
  );
}
