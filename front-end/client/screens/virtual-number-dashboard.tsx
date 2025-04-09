import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Clipboard,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "../api";

interface VirtualNumber {
  id: number;
  unread_count: number;
  numbers: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const VirtualNumberDashboard: React.FC = () => {
  const router = useRouter();
  const [virtualNumbers, setVirtualNumbers] = useState<VirtualNumber[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [locationModalVisible, setLocationModalVisible] =
    useState<boolean>(false);
  const [categoryModalVisible, setCategoryModalVisible] =
    useState<boolean>(false);
  const [infoModalVisible, setInfoModalVisible] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [processingSteps, setProcessingSteps] = useState<{
    [key: string]: boolean;
  }>({
    sendingRequest: false,
    backendValidation: false,
    sendingPhysical: false,
    requestingVirtual: false,
    sendingToTelecom: false,
    telecomLinks: false,
    storingLinkage: false,
    virtualReady: false,
  });
  const [locationDetected, setLocationDetected] = useState<boolean>(false);

  const fetchVirtualNumbers = async () => {
    try {
      const response = await api.get("/virtual-numbers/");
      setVirtualNumbers(response.data);
    } catch (error) {
      console.error("Error fetching virtual numbers:", error);
      Alert.alert("Error", "Failed to load virtual numbers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVirtualNumbers();
  }, []);

  // Get total count of virtual numbers
  const totalCount = virtualNumbers.length;

  // Count available numbers (assuming 3 is max now)
  const availableCount = totalCount >= 3 ? 0 : 3 - totalCount;

  // Filter numbers by category
  const getNumbersByCategory = (category: string) => {
    return virtualNumbers.filter((num) => num.category === category);
  };

  const ecommerceNumbers = getNumbersByCategory("e-commerce");
  const socialMediaNumbers = getNumbersByCategory("social-media");
  const personalNumbers = getNumbersByCategory("personal");

  // Get unread count by category
  const getUnreadCount = (category: string): number => {
    const numbers = virtualNumbers.filter((num) => num.category === category);
    return numbers.reduce((total, num) => total + num.unread_count, 0);
  };

  const ecommerceUnreadCount = getUnreadCount("e-commerce");
  const socialMediaUnreadCount = getUnreadCount("social-media");
  const personalUnreadCount = getUnreadCount("personal");

  // Get available categories (categories not already used)
  const getAvailableCategories = () => {
    const usedCategories = virtualNumbers.map((num) =>
      num.category.toLowerCase()
    );
    return ["e-commerce", "social-media", "personal"].filter(
      (category) => !usedCategories.includes(category.toLowerCase())
    );
  };

  const availableCategories = getAvailableCategories();

  const copyToClipboard = (number: string): void => {
    Clipboard.setString(number);
    Alert.alert("Copied", `${number} copied to clipboard`);
  };

  const handleRequestPress = () => {
    // Show location detection modal
    setLocationModalVisible(true);
    setLocationDetected(false);
    // Simulate location detection (2 seconds)
    setTimeout(() => {
      setLocationDetected(true);
      setTimeout(() => {
        setLocationModalVisible(false);
        setCategoryModalVisible(true);
        // Set default selected category if available
        if (availableCategories.length > 0) {
          setSelectedCategory(availableCategories[0]);
        }
      }, 1000);
    }, 2000);
  };

  const handleCategorySubmit = async () => {
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    setCategoryModalVisible(false);
    setInfoModalVisible(true);

    // Simulate processing steps with delays
    const simulateProcessing = async () => {
      const steps = Object.keys(processingSteps);
      for (let i = 0; i < steps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        setProcessingSteps((prev) => ({ ...prev, [steps[i]]: true }));
      }

      // After all steps are done, create the virtual number
      try {
        await api.post("/create-virtual-number/", {
          geo_code: "IN", // Hardcoded to India as per requirements
          category: selectedCategory,
        });

        // Wait 1.5 seconds before refreshing and closing the modal
        setTimeout(() => {
          setInfoModalVisible(false);
          fetchVirtualNumbers(); // Refresh the numbers list
          setProcessingSteps({
            sendingRequest: false,
            backendValidation: false,
            sendingPhysical: false,
            requestingVirtual: false,
            sendingToTelecom: false,
            telecomLinks: false,
            storingLinkage: false,
            virtualReady: false,
          });
          setSelectedCategory("");
        }, 1500);
      } catch (error) {
        console.error("Error creating virtual number:", error);
        setInfoModalVisible(false);
        Alert.alert("Error", "Failed to create virtual number");
      }
    };

    simulateProcessing();
  };

  const formatCategoryName = (category: string) => {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/")}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Virtual numbers</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Summary Cards  */}
        <View style={styles.summaryCard}>
          {/* Top row: E-commerce and Social Media */}
          <View style={styles.summaryRow}>
            {/* E-commerce box */}
            <View style={styles.summaryBoxTop}>
              {ecommerceNumbers.length > 0 && (
                <>
                  <View style={styles.tagContainer}>
                    <Text style={styles.summaryTag}>E-COMMERCE</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(ecommerceNumbers[0].numbers)}
                    style={styles.copyableNumber}
                  >
                    <Text style={styles.summaryNumber}>
                      {ecommerceNumbers[0].numbers}
                    </Text>
                    <Ionicons
                      name="copy-outline"
                      size={14}
                      color="#666"
                      style={styles.copyIcon}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Social media box */}
            <View style={styles.summaryBoxTop}>
              {socialMediaNumbers.length > 0 && (
                <>
                  <View style={styles.tagContainer}>
                    <Text style={styles.summaryTag}>SOCIAL-MEDIA</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      copyToClipboard(socialMediaNumbers[0].numbers)
                    }
                    style={styles.copyableNumber}
                  >
                    <Text style={styles.summaryNumber}>
                      {socialMediaNumbers[0].numbers}
                    </Text>
                    <Ionicons
                      name="copy-outline"
                      size={14}
                      color="#666"
                      style={styles.copyIcon}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Bottom row: Personal */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryBoxBottom}>
              {personalNumbers.length > 0 && (
                <>
                  <View style={styles.tagContainer}>
                    <Text style={styles.summaryTag}>PERSONAL</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(personalNumbers[0].numbers)}
                    style={styles.copyableNumber}
                  >
                    <Text style={styles.summaryNumber}>
                      {personalNumbers[0].numbers}
                    </Text>
                    <Ionicons
                      name="copy-outline"
                      size={14}
                      color="#666"
                      style={styles.copyIcon}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Summary statistics - Can be included if needed */}
          <View style={styles.statsRow}>
            <View style={styles.statsBox}>
              <Text style={styles.statsLabel}>Total virtual numbers</Text>
              <Text style={styles.statsValue}>{totalCount}</Text>
            </View>
            <View style={styles.statsBox}>
              <Text style={styles.statsLabel}>Available numbers</Text>
              <Text style={styles.statsValue}>{availableCount}</Text>
            </View>
          </View>
        </View>

        {/* Request Button - Show only if available numbers > 0 */}
        {availableCount > 0 && (
          <TouchableOpacity
            style={styles.requestButton}
            onPress={handleRequestPress}
          >
            <Text style={styles.requestText}>request</Text>
          </TouchableOpacity>
        )}

        {/* Manage Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>manage</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Dynamic Manage Cards based on API data */}
        {ecommerceNumbers.map((number) => (
          <TouchableOpacity
            key={number.id}
            onPress={() => router.push("/e-commerce")}
            style={styles.manageCard}
          >
            <View>
              {number.unread_count > 0 && (
                <View style={styles.notificationContainer}>
                  <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                  <Text style={styles.notificationText}>
                    {number.unread_count} new notifications
                  </Text>
                </View>
              )}
              <Text style={styles.manageTitle}>
                {formatCategoryName(number.category)}
              </Text>
              <Text style={styles.manageNumber}>({number.numbers})</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#000" />
          </TouchableOpacity>
        ))}

        {socialMediaNumbers.map((number) => (
          <TouchableOpacity
            key={number.id}
            onPress={() => router.push("/social")}
            style={styles.manageCard}
          >
            <View>
              {number.unread_count > 0 && (
                <View style={styles.notificationContainer}>
                  <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                  <Text style={styles.notificationText}>
                    {number.unread_count} new notifications
                  </Text>
                </View>
              )}
              <Text style={styles.manageTitle}>
                {formatCategoryName(number.category)}
              </Text>
              <Text style={styles.manageNumber}>({number.numbers})</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#000" />
          </TouchableOpacity>
        ))}

        {personalNumbers.map((number) => (
          <TouchableOpacity
            key={number.id}
            onPress={() => router.push("/personal")}
            style={styles.manageCard}
          >
            <View>
              {number.unread_count > 0 && (
                <View style={styles.notificationContainer}>
                  <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                  <Text style={styles.notificationText}>
                    {number.unread_count} new notifications
                  </Text>
                </View>
              )}
              <Text style={styles.manageTitle}>
                {formatCategoryName(number.category)}
              </Text>
              <Text style={styles.manageNumber}>({number.numbers})</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#000" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Location Detection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={locationModalVisible}
      >
        <TouchableWithoutFeedback
          onPress={() => setLocationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Detecting location...</Text>
                <ActivityIndicator
                  size="large"
                  color="#4CAF50"
                  style={styles.spinner}
                />
                {locationDetected && (
                  <>
                    <Text style={styles.locationText}>
                      Location detected: INDIA
                    </Text>
                    <Text style={styles.locationSubText}>
                      You can generate virtual numbers for India
                    </Text>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={categoryModalVisible}
      >
        <TouchableWithoutFeedback
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Create a virtual number</Text>

                <View style={styles.categoryButtonsContainer}>
                  {availableCategories.length > 0 ? (
                    availableCategories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryButton,
                          selectedCategory === category &&
                            styles.selectedCategoryButton,
                        ]}
                        onPress={() => setSelectedCategory(category)}
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            selectedCategory === category &&
                              styles.selectedCategoryButtonText,
                          ]}
                        >
                          {formatCategoryName(category)}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.noCategoriesContainer}>
                      <Ionicons name="warning" size={24} color="#FFA500" />
                      <Text style={styles.noCategoriesText}>
                        No categories available. You've reached the maximum of 3
                        numbers.
                      </Text>
                    </View>
                  )}
                </View>

                {availableCategories.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      !selectedCategory && styles.disabledButton,
                    ]}
                    onPress={handleCategorySubmit}
                    disabled={!selectedCategory}
                  >
                    <Text style={styles.requestText}>create</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Info/Processing Modal */}
      <Modal animationType="fade" transparent={true} visible={infoModalVisible}>
        <TouchableWithoutFeedback
          onPress={() => {
            // Don't allow closing during processing
            if (!Object.values(processingSteps).every((step) => step)) {
              return;
            }
            setInfoModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.infoModalContainer}>
                <Text style={styles.modalTitle}>Processing your request</Text>

                <View style={styles.processingSteps}>
                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.sendingRequest
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={
                        processingSteps.sendingRequest ? "#4CAF50" : "#ccc"
                      }
                    />
                    <Text style={styles.processingText}>
                      Sending virtual number creation request to backend
                    </Text>
                  </View>

                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.backendValidation
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={
                        processingSteps.backendValidation ? "#4CAF50" : "#ccc"
                      }
                    />
                    <Text style={styles.processingText}>
                      Backend receives and validates user input
                    </Text>
                  </View>

                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.sendingPhysical
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={
                        processingSteps.sendingPhysical ? "#4CAF50" : "#ccc"
                      }
                    />
                    <Text style={styles.processingText}>
                      Sending physical (actual) number and selected category to
                      backend
                    </Text>
                  </View>

                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.requestingVirtual
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={
                        processingSteps.requestingVirtual ? "#4CAF50" : "#ccc"
                      }
                    />
                    <Text style={styles.processingText}>
                      Backend requests virtual number from Telecom API
                    </Text>
                  </View>

                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.sendingToTelecom
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={
                        processingSteps.sendingToTelecom ? "#4CAF50" : "#ccc"
                      }
                    />
                    <Text style={styles.processingText}>
                      Sending actual number + generated virtual number to
                      Telecom API for mapping
                    </Text>
                  </View>

                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.telecomLinks
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={processingSteps.telecomLinks ? "#4CAF50" : "#ccc"}
                    />
                    <Text style={styles.processingText}>
                      Telecom API links numbers and sends back confirmation
                    </Text>
                  </View>

                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.storingLinkage
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={
                        processingSteps.storingLinkage ? "#4CAF50" : "#ccc"
                      }
                    />
                    <Text style={styles.processingText}>
                      Backend stores linkage and activates the virtual number
                    </Text>
                  </View>

                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.virtualReady
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={processingSteps.virtualReady ? "#4CAF50" : "#ccc"}
                    />
                    <Text style={styles.processingText}>
                      Virtual number is now live and ready for use
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    color: "#333",
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  summaryBoxTop: {
    width: "48%",
    alignItems: "center",
  },
  summaryBoxBottom: {
    width: "100%",
    alignItems: "center",
  },
  tagContainer: {
    marginBottom: 8,
  },
  summaryTag: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1c9b7c",
    textTransform: "uppercase",
  },
  copyableNumber: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
  },
  summaryNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  copyIcon: {
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 15,
    marginTop: 5,
  },
  statsBox: {
    flex: 1,
    alignItems: "center",
    flexDirection: "column",
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
    backgroundColor: "#4CAF50",
    marginHorizontal: 100,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  requestText: {
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
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    paddingHorizontal: 16,
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
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
  manageCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  manageTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  manageNumber: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  // Modal styles
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
  infoModalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginTop: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    shadowColor: "#000",
    shadowOpacity: 0,
    elevation: 0,
  },
  spinner: {
    marginVertical: 20,
  },
  locationText: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 8,
    color: "#333",
  },
  locationSubText: {
    fontSize: 15,
    color: "#666",
    marginTop: 6,
    textAlign: "center",
  },
  processingSteps: {
    width: "100%",
    paddingHorizontal: 10,
  },
  processingStep: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  processingText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    color: "#555",
  },
  // Category button styles
  categoryButtonsContainer: {
    width: "100%",
    marginVertical: 15,
  },
  categoryButton: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedCategoryButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  selectedCategoryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  noCategoriesContainer: {
    alignItems: "center",
    padding: 20,
  },
  noCategoriesText: {
    marginTop: 12,
    color: "#666",
    textAlign: "center",
    fontSize: 15,
  },
});

export default VirtualNumberDashboard;
