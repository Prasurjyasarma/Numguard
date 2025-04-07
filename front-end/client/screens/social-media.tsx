import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import data from "../data.json";

// Interface for notification data
interface Notification {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
  category: string;
  tag: string;
  is_read: boolean;
}

const SocialMedia: React.FC = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(data);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [currentCategory, setCurrentCategory] = useState("social media");
  const [currentVirtualNumber, setCurrentVirtualNumber] =
    useState("9834710256");

  useEffect(() => {
    // Filter notifications for current category
    const categoryNotifications = notifications.filter(
      (notif) => notif.category === currentCategory
    );
    setTotalNotifications(categoryNotifications.length);

    // Count unread notifications
    const unreadCount = categoryNotifications.filter(
      (notif) => !notif.is_read
    ).length;
    setUnreadNotifications(unreadCount);
  }, [notifications, currentCategory]);

  const handleNotificationPress = (id: number) => {
    // Update is_read status to true when notification is clicked
    const updatedNotifications = notifications.map((notif) =>
      notif.id === id ? { ...notif, is_read: true } : notif
    );
    setNotifications(updatedNotifications);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} - ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const handleDeleteAll = () => {
    // Filter out notifications of current category
    const filteredNotifications = notifications.filter(
      (notif) => notif.category !== currentCategory
    );
    setNotifications(filteredNotifications);
  };

  // Filter notifications for current category
  const filteredNotifications = notifications.filter(
    (notif) => notif.category === currentCategory
  );

  const renderSocialMediaContent = (item: Notification) => {
    switch (item.tag) {
      case "instagram":
        return (
          <>
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.actionText}>Tap to view activity</Text>
          </>
        );
      case "twitter":
        return (
          <>
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.actionText}>View profile</Text>
          </>
        );
      case "facebook":
        return (
          <>
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.actionText}>See post</Text>
          </>
        );
      default:
        return <Text style={styles.messageText}>{item.message}</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerCategory}>{currentCategory}</Text>
          <Text style={styles.headerNumber}>({currentVirtualNumber})</Text>
        </View>
        <View style={styles.profileIcon}>
          <Ionicons name="help-circle-outline" size={24} color="#000" />
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total notifications</Text>
          <Text style={styles.statValue}>{totalNotifications}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total unread notifications</Text>
          <Text style={styles.statValue}>{unreadNotifications}</Text>
        </View>
      </View>

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAll}>
        <Text style={styles.deleteButtonText}>delete</Text>
      </TouchableOpacity>

      {/* Messages Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>messages</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.notificationItem}
            onPress={() => handleNotificationPress(item.id)}
          >
            {!item.is_read && (
              <View style={styles.unreadIndicator}>
                <Ionicons name="alert-circle" size={16} color="#FF3B30" />
              </View>
            )}
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.senderText}>
                  from: {item.sender.toLowerCase()}
                </Text>
                <Text style={styles.timestampText}>
                  Received: {formatTimestamp(item.timestamp)}
                </Text>
              </View>
              {renderSocialMediaContent(item)}
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  headerCategory: {
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  headerNumber: {
    fontSize: 16,
    color: "#666",
    marginLeft: 4,
  },
  profileIcon: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#ddd",
    marginHorizontal: 8,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    marginHorizontal: 100,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    paddingHorizontal: 16,
    color: "#666",
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  notificationItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    padding: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadIndicator: {
    marginRight: 8,
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  senderText: {
    fontSize: 12,
    fontWeight: "500",
  },
  timestampText: {
    fontSize: 10,
    color: "#666",
  },
  messageText: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: "500",
  },
  actionText: {
    fontSize: 13,
    color: "#007AFF",
    marginTop: 4,
    fontWeight: "500",
  },
});

export default SocialMedia;
