import { useState, useMemo } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useSchedules,
  type ScheduleType,
  type TournamentSchedule,
} from "@/services/hooks/useSchedules";
import {
  useScheduleItems,
  type TournamentScheduleItem,
} from "@/services/hooks/useScheduleItems";

const PLATFORMS = ["Poker Stars", "GG", "Party Poker", "888", "Champions", "WPT", "YA", "WPN", "ACR"];
const CURRENCIES = ["USD", "EUR", "BRL"];

type ItemDraft = { time: string; platform: string; name: string; currency: string; buyIn: string };
const EMPTY_DRAFT: ItemDraft = { time: "", platform: "GG", name: "", currency: "USD", buyIn: "" };

// ─── Platform Picker Modal ────────────────────────────────────────────────────

function PlatformPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (p: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.pickerSheet}>
          <Text style={styles.pickerTitle}>Plataforma</Text>
          {PLATFORMS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.pickerOption, selected === p && styles.pickerOptionActive]}
              onPress={() => { onSelect(p); onClose(); }}
            >
              <Text style={[styles.pickerOptionText, selected === p && styles.pickerOptionTextActive]}>
                {p}
              </Text>
              {selected === p && <Ionicons name="checkmark" size={16} color="#22c55e" />}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Currency Picker Modal ────────────────────────────────────────────────────

function CurrencyPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (c: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.pickerSheet}>
          <Text style={styles.pickerTitle}>Moeda</Text>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.pickerOption, selected === c && styles.pickerOptionActive]}
              onPress={() => { onSelect(c); onClose(); }}
            >
              <Text style={[styles.pickerOptionText, selected === c && styles.pickerOptionTextActive]}>
                {c}
              </Text>
              {selected === c && <Ionicons name="checkmark" size={16} color="#22c55e" />}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Item Form Modal ──────────────────────────────────────────────────────────

function ItemFormModal({
  visible,
  draft,
  onChange,
  onSubmit,
  onClose,
  isLoading,
  isEditing,
}: {
  visible: boolean;
  draft: ItemDraft;
  onChange: (patch: Partial<ItemDraft>) => void;
  onSubmit: () => void;
  onClose: () => void;
  isLoading: boolean;
  isEditing: boolean;
}) {
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <PlatformPickerModal
        visible={showPlatformPicker}
        selected={draft.platform}
        onSelect={(p) => onChange({ platform: p })}
        onClose={() => setShowPlatformPicker(false)}
      />
      <CurrencyPickerModal
        visible={showCurrencyPicker}
        selected={draft.currency}
        onSelect={(c) => onChange({ currency: c })}
        onClose={() => setShowCurrencyPicker(false)}
      />
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.formSheet}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>{isEditing ? "Editar torneio" : "Adicionar torneio"}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.fieldLabel}>Horário</Text>
              <TextInput
                style={styles.input}
                value={draft.time}
                onChangeText={(t) => onChange({ time: t })}
                placeholder="00:00"
                placeholderTextColor="#444"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Plataforma</Text>
              <TouchableOpacity style={styles.selectButton} onPress={() => setShowPlatformPicker(true)}>
                <Text style={styles.selectButtonText}>{draft.platform}</Text>
                <Ionicons name="chevron-down" size={14} color="#888" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Nome do torneio</Text>
            <TextInput
              style={styles.input}
              value={draft.name}
              onChangeText={(t) => onChange({ name: t })}
              placeholder="Ex: Sunday Warm-Up"
              placeholderTextColor="#444"
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Moeda</Text>
              <TouchableOpacity style={styles.selectButton} onPress={() => setShowCurrencyPicker(true)}>
                <Text style={styles.selectButtonText}>{draft.currency}</Text>
                <Ionicons name="chevron-down" size={14} color="#888" />
              </TouchableOpacity>
            </View>
            <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.fieldLabel}>Buy-in</Text>
              <TextInput
                style={styles.input}
                value={draft.buyIn}
                onChangeText={(t) => onChange({ buyIn: t })}
                placeholder="0.00"
                placeholderTextColor="#444"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={onSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#0a0a0a" />
            ) : (
              <Text style={styles.submitButtonText}>{isEditing ? "Salvar" : "Adicionar"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  visible,
  title,
  description,
  onConfirm,
  onCancel,
  isLoading,
}: {
  visible: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={styles.confirmSheet}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmDescription}>{description}</Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, isLoading && styles.submitButtonDisabled]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.deleteButtonText}>Remover</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: TournamentScheduleItem;
  onEdit: (item: TournamentScheduleItem) => void;
  onDelete: (item: TournamentScheduleItem) => void;
}) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemLeft}>
        <View style={styles.itemTimePlatform}>
          <Text style={styles.itemTime}>{item.time}</Text>
          <View style={styles.platformBadge}>
            <Text style={styles.platformBadgeText}>{item.platform}</Text>
          </View>
        </View>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemBuyIn}>
          {item.currency} {Number(item.buyIn).toFixed(2)}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.iconButton} onPress={() => onEdit(item)}>
          <Ionicons name="pencil-outline" size={16} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, { marginLeft: 4 }]} onPress={() => onDelete(item)}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const [activeTab, setActiveTab] = useState<ScheduleType>("WEEKLY");
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);

  const [isCreatingGrade, setIsCreatingGrade] = useState(false);
  const [newGradeName, setNewGradeName] = useState("");

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TournamentScheduleItem | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft>(EMPTY_DRAFT);

  const [deleteGradeTarget, setDeleteGradeTarget] = useState<TournamentSchedule | null>(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<TournamentScheduleItem | null>(null);

  const { getSchedules, schedules, createSchedule, deleteSchedule } = useSchedules(activeTab);
  const { getItems, items, createItem, updateItem, deleteItem } = useScheduleItems(activeScheduleId);

  const activeSchedule = schedules.find((s) => s.id === activeScheduleId) ?? null;

  const totalBuyIn = useMemo(
    () => items.reduce((acc, i) => acc + Number(i.buyIn), 0),
    [items]
  );

  const buyInSummary = useMemo(() => {
    const map: Record<string, number> = {};
    for (const i of items) {
      const key = Number(i.buyIn).toFixed(2);
      map[key] = (map[key] ?? 0) + 1;
    }
    return Object.entries(map)
      .map(([buyIn, count]) => ({ buyIn: Number(buyIn), count }))
      .sort((a, b) => b.buyIn - a.buyIn);
  }, [items]);

  const platformSummary = useMemo(() => {
    const map: Record<string, { count: number; totalBuyIn: number }> = {};
    for (const i of items) {
      if (!map[i.platform]) map[i.platform] = { count: 0, totalBuyIn: 0 };
      map[i.platform]!.count += 1;
      map[i.platform]!.totalBuyIn += Number(i.buyIn);
    }
    return Object.entries(map)
      .map(([platform, data]) => ({ platform, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  function handleTabChange(tab: ScheduleType) {
    setActiveTab(tab);
    setActiveScheduleId(null);
    setIsCreatingGrade(false);
    setNewGradeName("");
  }

  function handleSelectSchedule(id: string) {
    setActiveScheduleId(id === activeScheduleId ? null : id);
  }

  function handleOpenAddItem() {
    setEditingItem(null);
    setItemDraft(EMPTY_DRAFT);
    setShowItemModal(true);
  }

  function handleOpenEditItem(item: TournamentScheduleItem) {
    setEditingItem(item);
    setItemDraft({
      time: item.time,
      platform: item.platform,
      name: item.name,
      currency: item.currency,
      buyIn: String(item.buyIn),
    });
    setShowItemModal(true);
  }

  async function handleSubmitItem() {
    if (!itemDraft.name.trim() || !itemDraft.buyIn) return;
    const payload = {
      time: itemDraft.time,
      platform: itemDraft.platform,
      name: itemDraft.name.trim(),
      currency: itemDraft.currency,
      buyIn: Number(itemDraft.buyIn),
    };
    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, data: payload });
    } else {
      await createItem.mutateAsync(payload);
    }
    setShowItemModal(false);
  }

  async function handleConfirmCreateGrade() {
    if (!newGradeName.trim()) return;
    await createSchedule.mutateAsync({ name: newGradeName.trim(), type: activeTab });
    setNewGradeName("");
    setIsCreatingGrade(false);
  }

  async function handleConfirmDeleteGrade() {
    if (!deleteGradeTarget) return;
    if (activeScheduleId === deleteGradeTarget.id) setActiveScheduleId(null);
    await deleteSchedule.mutateAsync(deleteGradeTarget.id);
    setDeleteGradeTarget(null);
  }

  async function handleConfirmDeleteItem() {
    if (!deleteItemTarget?.id) return;
    await deleteItem.mutateAsync(deleteItemTarget.id);
    setDeleteItemTarget(null);
  }

  const isSubmittingItem = createItem.isPending || updateItem.isPending;

  return (
    <SafeAreaView style={styles.container}>
      <ItemFormModal
        visible={showItemModal}
        draft={itemDraft}
        onChange={(patch) => setItemDraft((d) => ({ ...d, ...patch }))}
        onSubmit={handleSubmitItem}
        onClose={() => setShowItemModal(false)}
        isLoading={isSubmittingItem}
        isEditing={!!editingItem}
      />
      <ConfirmModal
        visible={!!deleteGradeTarget}
        title="Remover grade"
        description={`Tem certeza que deseja remover "${deleteGradeTarget?.name}"? Todos os torneios da grade serão removidos.`}
        onConfirm={handleConfirmDeleteGrade}
        onCancel={() => setDeleteGradeTarget(null)}
        isLoading={deleteSchedule.isPending}
      />
      <ConfirmModal
        visible={!!deleteItemTarget}
        title="Remover torneio"
        description={`Tem certeza que deseja remover "${deleteItemTarget?.name}" da grade?`}
        onConfirm={handleConfirmDeleteItem}
        onCancel={() => setDeleteItemTarget(null)}
        isLoading={deleteItem.isPending}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => { getSchedules.refetch(); getItems.refetch(); }}
            tintColor="#d4a843"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Planejamento</Text>
          <Text style={styles.headerTitle}>Grades</Text>
        </View>

        {/* Type Tabs */}
        <View style={styles.tabs}>
          {(["WEEKLY", "SUNDAY"] as ScheduleType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => handleTabChange(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === "WEEKLY" ? "Semanal" : "Domingo"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grade Selector */}
        <View style={styles.gradeSection}>
          {getSchedules.isLoading ? (
            <ActivityIndicator size="small" color="#d4a843" style={{ marginVertical: 8 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradeScroll}>
              {schedules.map((s) => (
                <View key={s.id} style={styles.gradeChipWrapper}>
                  <TouchableOpacity
                    style={[styles.gradeChip, activeScheduleId === s.id && styles.gradeChipActive]}
                    onPress={() => handleSelectSchedule(s.id)}
                  >
                    <Text style={[styles.gradeChipText, activeScheduleId === s.id && styles.gradeChipTextActive]}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.gradeDeleteBtn}
                    onPress={() => setDeleteGradeTarget(s)}
                  >
                    <Ionicons name="close" size={12} color="#555" />
                  </TouchableOpacity>
                </View>
              ))}

              {isCreatingGrade ? (
                <View style={styles.newGradeInput}>
                  <TextInput
                    style={styles.newGradeTextInput}
                    value={newGradeName}
                    onChangeText={setNewGradeName}
                    placeholder="Nome da grade"
                    placeholderTextColor="#444"
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleConfirmCreateGrade} disabled={createSchedule.isPending}>
                    <Ionicons name="checkmark" size={18} color="#22c55e" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setIsCreatingGrade(false); setNewGradeName(""); }} style={{ marginLeft: 6 }}>
                    <Ionicons name="close" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.newGradeBtn} onPress={() => setIsCreatingGrade(true)}>
                  <Ionicons name="add" size={14} color="#888" />
                  <Text style={styles.newGradeBtnText}>Nova grade</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>

        {/* Grade Content */}
        {activeScheduleId ? (
          <>
            {/* Summary Bar */}
            <View style={styles.summaryBar}>
              <Text style={styles.summaryText}>
                {items.length} torneios · ${totalBuyIn.toFixed(2)} buy-in
              </Text>
              <TouchableOpacity style={styles.addItemBtn} onPress={handleOpenAddItem}>
                <Ionicons name="add" size={16} color="#0a0a0a" />
                <Text style={styles.addItemBtnText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {/* Items */}
            {getItems.isLoading ? (
              <ActivityIndicator color="#d4a843" style={{ marginTop: 24 }} />
            ) : items.length === 0 ? (
              <View style={styles.emptyItems}>
                <Text style={styles.emptyItemsText}>Nenhum torneio na grade</Text>
                <Text style={styles.emptyItemsSub}>Toque em Adicionar para incluir torneios</Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {[...items]
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onEdit={handleOpenEditItem}
                      onDelete={setDeleteItemTarget}
                    />
                  ))}
              </View>
            )}

            {/* Buy-in Summary */}
            {buyInSummary.length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>Resumo por buy-in</Text>
                {buyInSummary.map(({ buyIn, count }) => (
                  <View key={buyIn} style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>${buyIn.toFixed(2)}</Text>
                    <Text style={styles.summaryRowValue}>{count}x</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Platform Summary */}
            {platformSummary.length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>Resumo por plataforma</Text>
                {platformSummary.map(({ platform, count, totalBuyIn: total }) => (
                  <View key={platform} style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>{platform}</Text>
                    <Text style={styles.summaryRowValue}>
                      {count}x · ${total.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          schedules.length > 0 && (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>Selecione uma grade</Text>
              <Text style={styles.emptyItemsSub}>Toque em uma grade para ver os torneios</Text>
            </View>
          )
        )}

        {!getSchedules.isLoading && schedules.length === 0 && !isCreatingGrade && (
          <View style={styles.emptyItems}>
            <Text style={styles.emptyItemsText}>Nenhuma grade criada</Text>
            <Text style={styles.emptyItemsSub}>Toque em "Nova grade" para começar</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  scroll: { flex: 1 },
  header: { marginTop: 24, marginBottom: 20 },
  headerEyebrow: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1.62, color: "#555" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#f5f5f5" },

  // Tabs
  tabs: { flexDirection: "row", backgroundColor: "#111", borderRadius: 8, padding: 3, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  tabActive: { backgroundColor: "#1a1a1a" },
  tabText: { fontSize: 13, color: "#555", fontWeight: "500" },
  tabTextActive: { color: "#f5f5f5" },

  // Grade Chips
  gradeSection: { marginBottom: 16 },
  gradeScroll: { flexDirection: "row" },
  gradeChipWrapper: { flexDirection: "row", alignItems: "center", marginRight: 8 },
  gradeChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
    borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#111",
  },
  gradeChipActive: { borderColor: "#22c55e", backgroundColor: "#22c55e15" },
  gradeChipText: { color: "#888", fontSize: 13 },
  gradeChipTextActive: { color: "#22c55e", fontWeight: "600" },
  gradeDeleteBtn: {
    marginLeft: 4, width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center",
  },
  newGradeInput: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: "#111",
  },
  newGradeTextInput: { color: "#f5f5f5", fontSize: 13, minWidth: 120, marginRight: 8 },
  newGradeBtn: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 6, borderStyle: "dashed",
    paddingHorizontal: 12, paddingVertical: 6,
  },
  newGradeBtnText: { color: "#555", fontSize: 13, marginLeft: 4 },

  // Summary Bar
  summaryBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 12,
  },
  summaryText: { color: "#555", fontSize: 12 },
  addItemBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#22c55e", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
  },
  addItemBtnText: { color: "#0a0a0a", fontWeight: "600", fontSize: 13, marginLeft: 4 },

  // Items
  itemsList: { gap: 8 },
  itemCard: {
    backgroundColor: "#111", borderWidth: 1, borderColor: "#2a2a2a",
    borderRadius: 10, padding: 12,
    flexDirection: "row", alignItems: "center",
  },
  itemLeft: { flex: 1 },
  itemTimePlatform: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  itemTime: { color: "#d4a843", fontSize: 12, fontWeight: "600", marginRight: 8 },
  platformBadge: { backgroundColor: "#1a1a1a", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  platformBadgeText: { color: "#888", fontSize: 10 },
  itemName: { color: "#f5f5f5", fontSize: 13, fontWeight: "500", marginBottom: 2 },
  itemBuyIn: { color: "#555", fontSize: 11 },
  itemActions: { flexDirection: "row", alignItems: "center" },
  iconButton: {
    width: 32, height: 32, alignItems: "center", justifyContent: "center",
    backgroundColor: "#1a1a1a", borderRadius: 6,
  },

  // Summaries
  summaryCard: {
    backgroundColor: "#111", borderWidth: 1, borderColor: "#2a2a2a",
    borderRadius: 10, padding: 14, marginTop: 16,
  },
  summaryCardTitle: {
    fontSize: 9, textTransform: "uppercase", letterSpacing: 1.35,
    color: "#555", marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#1a1a1a",
  },
  summaryRowLabel: { color: "#888", fontSize: 13 },
  summaryRowValue: { color: "#f5f5f5", fontSize: 13, fontWeight: "500" },

  // Empty
  emptyItems: { alignItems: "center", paddingVertical: 48 },
  emptyItemsText: { color: "#555", fontSize: 14, marginBottom: 4 },
  emptyItemsSub: { color: "#333", fontSize: 12 },

  // Overlay / Modals
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },

  // Picker sheet
  pickerSheet: {
    backgroundColor: "#111", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20,
  },
  pickerTitle: { color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 },
  pickerOption: { paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pickerOptionActive: {},
  pickerOptionText: { color: "#888", fontSize: 15 },
  pickerOptionTextActive: { color: "#22c55e", fontWeight: "600" },

  // Form sheet
  formSheet: {
    backgroundColor: "#111", borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, paddingBottom: 36,
  },
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  formTitle: { color: "#f5f5f5", fontWeight: "600", fontSize: 16 },
  formRow: { flexDirection: "row", marginBottom: 14 },
  formField: { marginBottom: 14 },
  fieldLabel: { color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  input: {
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    color: "#f5f5f5", fontSize: 14,
  },
  selectButton: {
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    minWidth: 90,
  },
  selectButtonText: { color: "#f5f5f5", fontSize: 14 },
  submitButton: {
    backgroundColor: "#22c55e", borderRadius: 8, paddingVertical: 14,
    alignItems: "center", marginTop: 4,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: "#0a0a0a", fontWeight: "700", fontSize: 15 },

  // Confirm Modal
  confirmSheet: {
    backgroundColor: "#111", borderRadius: 16, padding: 24, margin: 20,
  },
  confirmTitle: { color: "#f5f5f5", fontWeight: "600", fontSize: 16, marginBottom: 8 },
  confirmDescription: { color: "#888", fontSize: 14, lineHeight: 20, marginBottom: 20 },
  confirmButtons: { flexDirection: "row", gap: 10 },
  cancelButton: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    borderWidth: 1, borderColor: "#2a2a2a", alignItems: "center",
  },
  cancelButtonText: { color: "#888", fontWeight: "500" },
  deleteButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: "#ef4444", alignItems: "center" },
  deleteButtonText: { color: "#fff", fontWeight: "600" },
});
