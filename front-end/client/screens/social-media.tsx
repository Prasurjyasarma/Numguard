import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../api";
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

// Interface for virtual number data
interface VirtualNumber {
  id: number;
  numbers: string;
  category: string;
  physical_number: number;
  is_active: boolean;
}

const SocialMedia: React.FC = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(data);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [currentCategory, setCurrentCategory] = useState("social-media");
  const [currentVirtualNumber, setCurrentVirtualNumber] = useState("");
  const [virtualNumberId, setVirtualNumberId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch virtual number based on category
  useEffect(() => {
    const fetchVirtualNumber = async () => {
      try {
        const response = await api.get(
          `/virtual-numbers/?category=${currentCategory}`
        );
        if (response.data && response.data.length > 0) {
          const virtualNumberData = response.data[0];
          setCurrentVirtualNumber(virtualNumberData.numbers);
          setVirtualNumberId(virtualNumberData.id);
        } else {
          setCurrentVirtualNumber("No number available");
        }
      } catch (error) {
        console.error("Error fetching virtual number:", error);
        Alert.alert("Error", "Failed to fetch virtual number");
      } finally {
        setLoading(false);
      }
    };

    fetchVirtualNumber();
  }, [currentCategory]);

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

  const handleDeleteConfirmation = () => {
    setModalVisible(true);
  };

  const handleCancelDelete = () => {
    setModalVisible(false);
  };

  const handleConfirmDelete = async () => {
    if (virtualNumberId) {
      try {
        setDeleteLoading(true);
        const response = await api.delete(
          `/delete-virtual-number/${virtualNumberId}/`
        );
        if (response.status === 200) {
          setModalVisible(false);
          router.push("/virtual-number-call");
        }
      } catch (error) {
        console.error("Error deleting virtual number:", error);
        Alert.alert("Error", "Failed to delete virtual number");
        setDeleteLoading(false);
        setModalVisible(false);
      }
    } else {
      Alert.alert("Error", "No virtual number to delete");
      setModalVisible(false);
    }
  };

  // Filter notifications for current category
  const filteredNotifications = notifications.filter(
    (notif) => notif.category === currentCategory
  );

  const formatCategoryName = (category: string) => {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const renderSocialMediaContent = (item: Notification) => {
    switch (item.tag) {
      case "instagram":
        return (
          <>
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.urlText}>Tap to view activity</Text>
          </>
        );
      case "twitter":
        return (
          <>
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.urlText}>View profile</Text>
          </>
        );
      case "facebook":
        return (
          <>
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.urlText}>See post</Text>
          </>
        );
      default:
        return <Text style={styles.messageText}>{item.message}</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {formatCategoryName(currentCategory)}
            </Text>
            <Text style={styles.headerNumber}>
              {loading ? "Loading..." : `(${currentVirtualNumber})`}
            </Text>
          </View>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <View style={styles.summaryCard}>
          <View style={styles.statsRow}>
            <View style={styles.statsBox}>
              <Text style={styles.statsLabel}>Total notifications</Text>
              <Text style={styles.statsValue}>{totalNotifications}</Text>
            </View>
            <View style={styles.statsBox}>
              <Text style={styles.statsLabel}>Unread notifications</Text>
              <Text style={styles.statsValue}>{unreadNotifications}</Text>
            </View>
          </View>
        </View>

        {/* Delete Button */}
        {virtualNumberId && (
          <TouchableOpacity
            style={styles.requestButton}
            onPress={handleDeleteConfirmation}
          >
            <Text style={styles.requestText}>delete number</Text>
          </TouchableOpacity>
        )}

        {/* Messages Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>messages</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Notifications List */}
        <View style={styles.listContainer}>
          {filteredNotifications.map((item) => (
            <TouchableOpacity
              key={item.id.toString()}
              style={styles.notificationItem}
              onPress={() => handleNotificationPress(item.id)}
            >
              {!item.is_read && (
                <View style={styles.notificationContainer}>
                  <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                  <Text style={styles.notificationText}>New</Text>
                </View>
              )}
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.senderText}>
                    from: {item.sender.toLowerCase()}
                  </Text>
                  <Text style={styles.timestampText}>
                    {formatTimestamp(item.timestamp)}
                  </Text>
                </View>
                {renderSocialMediaContent(item)}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this virtual number?
            </Text>
            {deleteLoading ? (
              <ActivityIndicator
                size="large"
                color="#FF3B30"
                style={styles.loadingIndicator}
              />
            ) : (
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancelDelete}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleConfirmDelete}
                >
                  <Text style={styles.confirmButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Reuse the exact same styles from the Ecommerce component
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  headerNumber: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  helpButton: {
    padding: 8,
  },
  summaryCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsBox: {
    flex: 1,
    alignItems: "center",
  },
  statsLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  requestButton: {
    backgroundColor: "#FF3B30",
    marginHorizontal: 100,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  requestText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textTransform: "uppercase",
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
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    paddingHorizontal: 16,
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  notificationItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  notificationText: {
    color: "#D32F2F",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  senderText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  timestampText: {
    fontSize: 12,
    color: "#666",
  },
  messageText: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
    color: "#333",
  },
  urlText: {
    fontSize: 14,
    color: "#1c9b7c",
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#333",
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    color: "#666",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 8,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: "#f1f1f1",
    shadowColor: "#000",
  },
  confirmButton: {
    backgroundColor: "#FF3B30",
    shadowColor: "#FF3B30",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingIndicator: {
    marginVertical: 20,
  },
});

export default SocialMedia;
