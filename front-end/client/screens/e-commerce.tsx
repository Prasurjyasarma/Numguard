import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

// Interface for message data
interface Message {
  id: number;
  virtual_number: number;
  sender: string;
  message_body: string;
  category: string;
  is_read: boolean;
  received_at: string;
  created_at: string;
}

// Interface for virtual number data
interface VirtualNumber {
  id: number;
  numbers: string;
  category: string;
  physical_number: number;
  is_active: boolean;
}

const Ecommerce: React.FC = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [currentCategory, setCurrentCategory] = useState("e-commerce");
  const [currentVirtualNumber, setCurrentVirtualNumber] = useState("");
  const [virtualNumberId, setVirtualNumberId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  const [messageDeleteLoading, setMessageDeleteLoading] = useState(false);
  const [messageDeleteModalVisible, setMessageDeleteModalVisible] = useState(false);
  
  // Reference for the auto-refresh interval
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Fetch messages based on category
  const fetchMessages = async () => {
    setIsAutoRefreshing(true);
    try {
      const response = await api.get(`/forward-message/?category=${currentCategory}`);
      if (response.data) {
        setMessages(response.data);
        
        // Calculate total and unread notifications
        const total = response.data.length;
        const unread = response.data.filter((msg: Message) => !msg.is_read).length;
        
        setTotalNotifications(total);
        setUnreadNotifications(unread);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      // Don't show alert during auto-refresh to avoid spamming the user
      if (!isAutoRefreshing) {
        Alert.alert("Error", "Failed to fetch messages");
      }
    } finally {
      setMessagesLoading(false);
      setIsAutoRefreshing(false);
    }
  };

  // Set up auto-refresh interval
  useEffect(() => {
    // Initial fetch
    if (currentCategory) {
      fetchMessages();
    }
    
    // Set up interval for auto-refresh every 3 seconds
    autoRefreshIntervalRef.current = setInterval(() => {
      if (currentCategory) {
        fetchMessages();
      }
    }, 3000);
    
    // Clean up interval on component unmount
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [currentCategory]);

  const handleNotificationPress = async (id: number) => {
    try {
      // Call API to mark message as read
      const response = await api.get(`/read-message/${id}/`);
      
      if (response.status === 200) {
        // Update local state to mark message as read
        const updatedMessages = messages.map((msg) =>
          msg.id === id ? { ...msg, is_read: true } : msg
        );
        setMessages(updatedMessages);
        
        // Update notification counts
        const updatedUnreadCount = unreadNotifications > 0 ? unreadNotifications - 1 : 0;
        setUnreadNotifications(updatedUnreadCount);
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
      Alert.alert("Error", "Failed to mark message as read");
    }
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

  // Handle message deletion request
  const handleMessageDeleteRequest = (messageId: number) => {
    setMessageToDelete(messageId);
    setMessageDeleteModalVisible(true);
  };

  // Cancel message deletion
  const handleCancelMessageDelete = () => {
    setMessageToDelete(null);
    setMessageDeleteModalVisible(false);
  };

  // Confirm and process message deletion
  const handleConfirmMessageDelete = async () => {
    if (messageToDelete) {
      try {
        setMessageDeleteLoading(true);
        const response = await api.delete(`/delete-message/${messageToDelete}/`);
        if (response.status === 200) {
          // Remove the deleted message from the state
          const updatedMessages = messages.filter(msg => msg.id !== messageToDelete);
          setMessages(updatedMessages);
          
          // Update notification counts
          const wasUnread = messages.find(msg => msg.id === messageToDelete)?.is_read === false;
          setTotalNotifications(prevTotal => prevTotal - 1);
          if (wasUnread) {
            setUnreadNotifications(prevUnread => prevUnread - 1);
          }
          
          setMessageDeleteModalVisible(false);
          Alert.alert("Success", "Message deleted successfully");
        }
      } catch (error) {
        console.error("Error deleting message:", error);
        Alert.alert("Error", "Failed to delete message");
      } finally {
        setMessageDeleteLoading(false);
        setMessageToDelete(null);
      }
    }
  };

  const formatCategoryName = (category: string) => {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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

        {/* Messages Divider with Auto-refresh Indicator */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>messages</Text>
          <View style={styles.dividerLine} />
          {isAutoRefreshing && (
            <View style={styles.refreshIndicator}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}
        </View>

        {/* Messages List */}
        <View style={styles.listContainer}>
          {messagesLoading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />
          ) : messages.length === 0 ? (
            <Text style={styles.noMessagesText}>No messages found</Text>
          ) : (
            messages.map((item) => (
              <TouchableOpacity
                key={item.id.toString()}
                style={styles.notificationItem}
                onPress={() => handleNotificationPress(item.id)}
              >
                <View style={styles.notificationHeader}>
                  {!item.is_read && (
                    <View style={styles.notificationContainer}>
                      <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                      <Text style={styles.notificationText}>New</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleMessageDeleteRequest(item.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.senderText}>
                      from: {item.sender.toLowerCase()}
                    </Text>
                    <Text style={styles.timestampText}>
                      {formatTimestamp(item.received_at || item.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.messageText}>{item.message_body}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Delete Virtual Number Confirmation Modal */}
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

      {/* Delete Message Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={messageDeleteModalVisible}
        onRequestClose={handleCancelMessageDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this message?
            </Text>
            {messageDeleteLoading ? (
              <ActivityIndicator
                size="large"
                color="#FF3B30"
                style={styles.loadingIndicator}
              />
            ) : (
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancelMessageDelete}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleConfirmMessageDelete}
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
    position: "relative",
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
  refreshIndicator: {
    position: "absolute",
    right: 16,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    minHeight: 100,
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
    alignItems: "center",
    marginBottom: 8,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
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
    marginBottom: 14,
    fontWeight: "500",
    color: "#333",
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
  noMessagesText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
  deleteButton: {
    padding: 8,
    zIndex: 1,
  },
});

export default Ecommerce;