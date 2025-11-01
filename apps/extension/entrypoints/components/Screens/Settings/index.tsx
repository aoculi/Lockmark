import { Button, Checkbox, Flex, Heading, Text } from "@radix-ui/themes";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { settingsStore } from "@/entrypoints/store/settings";
import { useNavigation } from "../../App";

import styles from "./styles.module.css";

export default function Settings() {
  const { navigate } = useNavigation();
  const [showHiddenTags, setShowHiddenTags] = useState(false);
  const [originalValue, setOriginalValue] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load current setting on mount
    const currentState = settingsStore.getState();
    setShowHiddenTags(currentState.showHiddenTags);
    setOriginalValue(currentState.showHiddenTags);

    // Subscribe to changes
    const unsubscribe = settingsStore.subscribe(() => {
      const state = settingsStore.getState();
      setShowHiddenTags(state.showHiddenTags);
      setOriginalValue(state.showHiddenTags);
    });

    return unsubscribe;
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    settingsStore.setShowHiddenTags(showHiddenTags);
    setOriginalValue(showHiddenTags);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const hasChanged = showHiddenTags !== originalValue;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Button
          variant="ghost"
          onClick={() => navigate("/vault")}
          className={styles.backButton}
        >
          <ArrowLeft strokeWidth={1} size={18} />
          Back
        </Button>
        <Heading size="8">Settings</Heading>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Text as="label" size="2">
            <Flex gap="2" align="center">
              <Checkbox
                style={{ paddingBottom: 10 }}
                checked={showHiddenTags}
                onCheckedChange={(checked) =>
                  setShowHiddenTags(checked === true)
                }
              />
              Display hidden tags
            </Flex>
          </Text>

          <Button type="submit" disabled={!hasChanged || isSaved}>
            {isSaved ? "Saved!" : "Save"}
          </Button>
        </form>
      </div>
    </div>
  );
}
