import { Button, Text } from "@radix-ui/themes";
import { EllipsisVertical, LineSquiggle } from "lucide-react";

import styles from "./styles.module.css";

export default function Tag({
  name,
  count,
  all = false,
  active = false,
  onClick,
}: {
  name: string;
  count: number;
  all: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      className={`${styles.tag} ${active ? "" : styles.inactive}`}
      onClick={onClick}
    >
      <div className={styles.tagLabel}>
        {all && <LineSquiggle height={16} width={16} />}
        <Text>{name}</Text>
      </div>

      <div className={styles.tagEnd}>
        <Text>{count}</Text>
        {!all && <EllipsisVertical height={16} width={14} />}
      </div>
    </Button>
  );
}
