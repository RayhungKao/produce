import styles from "./index.module.scss";
import Navigation from "./navigation";

export default function Headers() {
  return (
    <div className={styles.container}>
      <Navigation />
    </div>
  );
}
