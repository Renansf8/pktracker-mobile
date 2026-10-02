import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTournaments } from "@/services/hooks/useTournaments";
import type { Tournament } from "@/services/hooks/types";
import { getTournamentProfitNative } from "@/utils/tournamentLucro";
import { useSchedules, type ScheduleType } from "@/services/hooks/useSchedules";
import {
  tournamentSpeedLabel,
  tournamentSpeeds,
  tournamentTypeLabel,
  tournamentTypes,
} from "@/utils/tournamentOptions";

const tournamentSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  platform: z.string().min(1, "Plataforma é obrigatória"),
  name: z.string().min(1, "Nome é obrigatório"),
  currency: z.string().min(1),
  buyIn: z.string().min(1, "Buy-in é obrigatório"),
  result: z.string().min(1, "Resultado é obrigatório"),
  itm: z.boolean().optional(),
  hasFt: z.boolean().optional(),
  position: z.string().optional(),
  type: z.string().optional(),
  speed: z.string().optional(),
});

type TournamentFormData = z.infer<typeof tournamentSchema>;

const PLATFORMS = [
  "Poker Stars",
  "GG",
  "Party Poker",
  "888",
  "Champions",
  "WPT",
  "YA",
  "WPN",
  "ACR",
];
const CURRENCIES = ["USD", "EUR", "BRL"];

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border?: string }> = {
  "Poker Stars": { bg: "#ef444420", text: "#ef4444" },
  "GG":          { bg: "#000000",   text: "#ffffff", border: "#333333" },
  "Party Poker": { bg: "#f9731620", text: "#f97316" },
  "888":         { bg: "#38bdf820", text: "#38bdf8" },
  "Champions":   { bg: "#d4a84320", text: "#d4a843" },
  "WPN":         { bg: "#ec489920", text: "#ec4899" },
  "YA":          { bg: "#22c55e20", text: "#22c55e" },
  "WPT":         { bg: "#1e3a8a40", text: "#93c5fd" },
};

function TournamentCard({
  tournament,
  onDelete,
  onEdit,
}: {
  tournament: Tournament;
  onDelete: (id: string) => void;
  onEdit: (tournament: Tournament) => void;
}) {
  const profit = getTournamentProfitNative(tournament);
  const isPositive = profit > 0;
  const dateObj = new Date(tournament.date);
  const date = dateObj.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  const time = dateObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.tournamentCard}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleSection}>
          <Text style={styles.tournamentName} numberOfLines={1}>
            {tournament.name}
          </Text>
          <View style={styles.cardMetaRow}>
            {(() => {
              const colors = PLATFORM_COLORS[tournament.platform];
              return colors ? (
                <Text
                  style={[
                    styles.badgePlatform,
                    {
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.border ?? "transparent",
                    },
                  ]}
                >
                  {tournament.platform}
                </Text>
              ) : (
                <Text style={styles.badgePlatformDefault}>{tournament.platform}</Text>
              );
            })()}
            <Text style={styles.tournamentMeta}>{date} · {time}</Text>
            {tournament.type && (
              <Text style={styles.badgeType}>
                {tournamentTypeLabel(tournament.type)}
              </Text>
            )}
            {tournament.speed && (
              <Text style={styles.badgeSpeed}>
                {tournamentSpeedLabel(tournament.speed)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.cardResultSection}>
          <Text
            style={[
              styles.profitText,
              {
                color: isPositive
                  ? "#22c55e"
                  : profit < 0
                    ? "#ef4444"
                    : "#888888",
              },
            ]}
          >
            {isPositive ? "+" : ""}
            {profit.toFixed(2)} {tournament.currency}
          </Text>
          {(tournament.itm ||
            tournament.hasFt ||
            tournament.position === 1) && (
            <View style={styles.badgesRow}>
              {tournament.itm && <Text style={styles.badgeItm}>ITM</Text>}
              {tournament.hasFt && <Text style={styles.badgeFt}>FT</Text>}
              {tournament.position === 1 && (
                <Text style={styles.badgeGold}>🥇</Text>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.buyInText}>
          Buy-in: {tournament.buyIn} {tournament.currency}
        </Text>
        <View style={styles.cardActions}>
          <Pressable onPress={() => onEdit(tournament)} hitSlop={8}>
            <Ionicons name="pencil-outline" size={16} color="#555555" />
          </Pressable>
          <Pressable
            onPress={() => {
              Alert.alert(
                "Deletar torneio",
                `Deseja deletar "${tournament.name}"?`,
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Deletar",
                    style: "destructive",
                    onPress: () => tournament.id && onDelete(tournament.id),
                  },
                ],
              );
            }}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={16} color="#555555" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function CreateTournamentModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
  tournament,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TournamentFormData) => void;
  isLoading: boolean;
  tournament?: Tournament;
}) {
  const isEditing = !!tournament;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      platform: "Poker Stars",
      name: "",
      currency: "USD",
      buyIn: "",
      result: "",
      itm: false,
      hasFt: false,
      position: "",
      type: "",
      speed: "",
    },
  });

  const itm = watch("itm");
  const hasFt = watch("hasFt");

  const handleClose = () => {
    reset();
    onClose();
  };

  // Preenche o form quando abre em modo edição
  useEffect(() => {
    if (!visible) return;
    if (tournament) {
      reset({
        date: new Date(tournament.date).toISOString().split("T")[0],
        platform: tournament.platform,
        name: tournament.name,
        currency: tournament.currency,
        buyIn: String(tournament.buyIn),
        result: String(tournament.result),
        itm: tournament.itm ?? false,
        hasFt: tournament.hasFt ?? false,
        position: tournament.position != null ? String(tournament.position) : "",
        type: tournament.type ?? "",
        speed: tournament.speed ?? "",
      });
    } else {
      reset({
        date: new Date().toISOString().split("T")[0],
        platform: "Poker Stars",
        name: "",
        currency: "USD",
        buyIn: "",
        result: "",
        itm: false,
        hasFt: false,
        position: "",
        type: "",
        speed: "",
      });
    }
  }, [visible, tournament]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{isEditing ? "Editar Torneio" : "Novo Torneio"}</Text>
          <Pressable onPress={handleClose}>
            <Ionicons name="close" size={24} color="#888888" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={{ paddingVertical: 20 }}
        >
          <View style={styles.formFields}>
            {/* Data */}
            <FormField label="Data (YYYY-MM-DD)" error={errors.date?.message}>
              <Controller
                control={control}
                name="date"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="2024-01-15"
                    placeholderTextColor="#555555"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </FormField>

            {/* Plataforma */}
            <View>
              <Text style={styles.fieldLabel}>Plataforma</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pillRow}>
                  {PLATFORMS.map((p) => (
                    <Controller
                      key={p}
                      control={control}
                      name="platform"
                      render={({ field: { value, onChange } }) => (
                        <Pressable
                          onPress={() => onChange(p)}
                          style={[
                            styles.pill,
                            value === p
                              ? styles.pillActive
                              : styles.pillInactive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.pillText,
                              { color: value === p ? "#d4a843" : "#888888" },
                            ]}
                          >
                            {p}
                          </Text>
                        </Pressable>
                      )}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Nome */}
            <FormField label="Nome do torneio" error={errors.name?.message}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Sunday Million"
                    placeholderTextColor="#555555"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </FormField>

            {/* Moeda */}
            <View>
              <Text style={styles.fieldLabel}>Moeda</Text>
              <View style={styles.currencyRow}>
                {CURRENCIES.map((c) => (
                  <Controller
                    key={c}
                    control={control}
                    name="currency"
                    render={({ field: { value, onChange } }) => (
                      <Pressable
                        onPress={() => onChange(c)}
                        style={[
                          styles.currencyPill,
                          value === c ? styles.pillActive : styles.pillInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.currencyText,
                            { color: value === c ? "#d4a843" : "#888888" },
                          ]}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    )}
                  />
                ))}
              </View>
            </View>

            {/* Buy-in e Resultado lado a lado */}
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <FormField label="Buy-in" error={errors.buyIn?.message}>
                  <Controller
                    control={control}
                    name="buyIn"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="109"
                        placeholderTextColor="#555555"
                        keyboardType="decimal-pad"
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                </FormField>
              </View>
              <View style={styles.column}>
                <FormField label="Resultado" error={errors.result?.message}>
                  <Controller
                    control={control}
                    name="result"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="0 ou ticket"
                        placeholderTextColor="#555555"
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                </FormField>
              </View>
            </View>

            {/* Toggles ITM / FT */}
            <View style={styles.toggleRow}>
              {[
                { field: "itm" as const, label: "ITM", value: itm },
                { field: "hasFt" as const, label: "Final Table", value: hasFt },
              ].map((toggle) => (
                <Pressable
                  key={toggle.field}
                  onPress={() => setValue(toggle.field, !toggle.value)}
                  style={[
                    styles.toggle,
                    toggle.value ? styles.toggleActive : styles.toggleInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: toggle.value ? "#d4a843" : "#555555" },
                    ]}
                  >
                    {toggle.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Tipo */}
            <View>
              <Text style={styles.fieldLabel}>Tipo (opcional)</Text>
              <View style={styles.currencyRow}>
                {[{ value: "", label: "Nenhum" }, ...tournamentTypes].map(
                  (opt) => (
                    <Controller
                      key={opt.value || "none"}
                      control={control}
                      name="type"
                      render={({ field: { value, onChange } }) => (
                        <Pressable
                          onPress={() => onChange(opt.value)}
                          style={[
                            styles.currencyPill,
                            value === opt.value
                              ? styles.pillActive
                              : styles.pillInactive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.currencyText,
                              {
                                color:
                                  value === opt.value ? "#d4a843" : "#888888",
                              },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      )}
                    />
                  ),
                )}
              </View>
            </View>

            {/* Velocidade */}
            <View>
              <Text style={styles.fieldLabel}>Velocidade (opcional)</Text>
              <View style={styles.currencyRow}>
                {[{ value: "", label: "Nenhuma" }, ...tournamentSpeeds].map(
                  (opt) => (
                    <Controller
                      key={opt.value || "none"}
                      control={control}
                      name="speed"
                      render={({ field: { value, onChange } }) => (
                        <Pressable
                          onPress={() => onChange(opt.value)}
                          style={[
                            styles.currencyPill,
                            value === opt.value
                              ? styles.pillActive
                              : styles.pillInactive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.currencyText,
                              {
                                color:
                                  value === opt.value ? "#d4a843" : "#888888",
                              },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      )}
                    />
                  ),
                )}
              </View>
            </View>

            {/* Posição */}
            <FormField
              label="Posição (opcional)"
              error={errors.position?.message}
            >
              <Controller
                control={control}
                name="position"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    placeholderTextColor="#555555"
                    keyboardType="number-pad"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </FormField>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.submitButton,
              { opacity: isLoading ? 0.7 : pressed ? 0.8 : 1 },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#0a0a0a" />
            ) : (
              <Text style={styles.submitButtonText}>{isEditing ? "Salvar Alterações" : "Registrar Torneio"}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Apply Schedule Modal ─────────────────────────────────────────────────────

function ApplyScheduleModal({
  visible,
  onClose,
  onApply,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (scheduleId: string) => void;
  isLoading: boolean;
}) {
  const [activeTab, setActiveTab] = useState<ScheduleType>("WEEKLY");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { schedules, getSchedules } = useSchedules(activeTab);

  function handleTabChange(tab: ScheduleType) {
    setActiveTab(tab);
    setSelectedId(null);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Aplicar grade</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color="#888888" />
          </Pressable>
        </View>

        {/* Type Tabs */}
        <View style={applyStyles.tabs}>
          {(["WEEKLY", "SUNDAY"] as ScheduleType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[applyStyles.tab, activeTab === tab && applyStyles.tabActive]}
              onPress={() => handleTabChange(tab)}
            >
              <Text style={[applyStyles.tabText, activeTab === tab && applyStyles.tabTextActive]}>
                {tab === "WEEKLY" ? "Semanal" : "Domingo"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingVertical: 16 }}>
          {getSchedules.isLoading ? (
            <ActivityIndicator color="#d4a843" style={{ marginTop: 32 }} />
          ) : schedules.length === 0 ? (
            <View style={applyStyles.empty}>
              <Text style={applyStyles.emptyText}>Nenhuma grade criada</Text>
              <Text style={applyStyles.emptySubtext}>Crie grades na aba Grades</Text>
            </View>
          ) : (
            <View style={applyStyles.list}>
              {schedules.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[applyStyles.scheduleCard, selectedId === s.id && applyStyles.scheduleCardActive]}
                  onPress={() => setSelectedId(s.id)}
                >
                  <View style={applyStyles.scheduleCardLeft}>
                    <View style={[applyStyles.radio, selectedId === s.id && applyStyles.radioActive]}>
                      {selectedId === s.id && <View style={applyStyles.radioDot} />}
                    </View>
                    <Text style={[applyStyles.scheduleName, selectedId === s.id && applyStyles.scheduleNameActive]}>
                      {s.name}
                    </Text>
                  </View>
                  <Text style={applyStyles.scheduleType}>
                    {s.type === "WEEKLY" ? "Semanal" : "Domingo"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.modalFooter}>
          <Pressable
            onPress={() => selectedId && onApply(selectedId)}
            disabled={!selectedId || isLoading}
            style={({ pressed }) => [
              styles.submitButton,
              { opacity: !selectedId || isLoading ? 0.5 : pressed ? 0.8 : 1 },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#0a0a0a" />
            ) : (
              <Text style={styles.submitButtonText}>Aplicar grade</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function FiltersModal({
  visible,
  onClose,
  type,
  onTypeChange,
  speed,
  onSpeedChange,
  minBuyInInput,
  onMinBuyInChange,
  maxBuyInInput,
  onMaxBuyInChange,
  onApply,
  onClear,
}: {
  visible: boolean;
  onClose: () => void;
  type: string;
  onTypeChange: (value: string) => void;
  speed: string;
  onSpeedChange: (value: string) => void;
  minBuyInInput: string;
  onMinBuyInChange: (value: string) => void;
  maxBuyInInput: string;
  onMaxBuyInChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filtros</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color="#888888" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={{ paddingVertical: 16, gap: 20 }}
        >
          <View>
            <Text style={styles.fieldLabel}>Tipo</Text>
            <View style={styles.currencyRow}>
              {[{ value: "", label: "Todos" }, ...tournamentTypes].map((opt) => (
                <Pressable
                  key={opt.value || "all"}
                  onPress={() => onTypeChange(opt.value)}
                  style={[
                    styles.currencyPill,
                    type === opt.value ? styles.pillActive : styles.pillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyText,
                      { color: type === opt.value ? "#d4a843" : "#888888" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.fieldLabel}>Velocidade</Text>
            <View style={styles.currencyRow}>
              {[{ value: "", label: "Todas" }, ...tournamentSpeeds].map((opt) => (
                <Pressable
                  key={opt.value || "all"}
                  onPress={() => onSpeedChange(opt.value)}
                  style={[
                    styles.currencyPill,
                    speed === opt.value ? styles.pillActive : styles.pillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyText,
                      { color: speed === opt.value ? "#d4a843" : "#888888" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <FormField label="Buy-in mínimo">
                <TextInput
                  style={styles.input}
                  placeholder="Mín."
                  placeholderTextColor="#555555"
                  keyboardType="decimal-pad"
                  value={minBuyInInput}
                  onChangeText={onMinBuyInChange}
                />
              </FormField>
            </View>
            <View style={styles.column}>
              <FormField label="Buy-in máximo">
                <TextInput
                  style={styles.input}
                  placeholder="Máx."
                  placeholderTextColor="#555555"
                  keyboardType="decimal-pad"
                  value={maxBuyInInput}
                  onChangeText={onMaxBuyInChange}
                />
              </FormField>
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Pressable
            onPress={onClear}
            style={({ pressed }) => [
              styles.submitButton,
              {
                backgroundColor: "#1a1a1a",
                borderWidth: 1,
                borderColor: "#2a2a2a",
                marginBottom: 8,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.submitButtonText, { color: "#d4a843" }]}>
              Limpar filtros
            </Text>
          </Pressable>
          <Pressable
            onPress={onApply}
            style={({ pressed }) => [
              styles.submitButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.submitButtonText}>Aplicar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

export default function TournamentsScreen() {
  const [page, setPage] = useState(1);
  const [platform, setPlatform] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [type, setType] = useState("");
  const [speed, setSpeed] = useState("");
  const [minBuyInInput, setMinBuyInInput] = useState("");
  const [maxBuyInInput, setMaxBuyInInput] = useState("");
  const [minBuyIn, setMinBuyIn] = useState<number | undefined>(undefined);
  const [maxBuyIn, setMaxBuyIn] = useState<number | undefined>(undefined);

  const hasActiveExtraFilter =
    type !== "" || speed !== "" || minBuyIn !== undefined || maxBuyIn !== undefined;

  const applyFilters = () => {
    const toNumber = (v: string) => {
      const trimmed = v.trim();
      if (trimmed === "") return undefined;
      const parsed = Number(trimmed.replace(",", "."));
      return Number.isNaN(parsed) ? undefined : parsed;
    };
    setMinBuyIn(toNumber(minBuyInInput));
    setMaxBuyIn(toNumber(maxBuyInInput));
    setPage(1);
    setIsFiltersModalOpen(false);
  };

  const clearExtraFilters = () => {
    setType("");
    setSpeed("");
    setMinBuyInInput("");
    setMaxBuyInInput("");
    setMinBuyIn(undefined);
    setMaxBuyIn(undefined);
    setPage(1);
    setIsFiltersModalOpen(false);
  };

  const { getAllTournaments, createTournament, deleteTournament, updateTournament, applySchedule } =
    useTournaments({
      platform,
      page,
      limit: 20,
      type: type as NonNullable<Tournament["type"]> | "",
      speed: speed as NonNullable<Tournament["speed"]> | "",
      minBuyIn,
      maxBuyIn,
    });

  const { data: response, isLoading, refetch } = getAllTournaments;

  const tournaments: Tournament[] =
    (response?.data as { data?: Tournament[] })?.data ?? [];
  const totalPages: number =
    (response?.data as { totalPages?: number })?.totalPages ?? 1;
  const total: number = (response?.data as { total?: number })?.total ?? 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCreate = (data: {
    date: string;
    platform: string;
    name: string;
    currency: string;
    buyIn: string;
    result: string;
    itm?: boolean;
    hasFt?: boolean;
    position?: string;
    type?: string;
    speed?: string;
  }) => {
    const toFloat = (v: string) => parseFloat(v.replace(",", ".")) || 0;
    createTournament.mutate(
      {
        date: data.date,
        platform: data.platform,
        name: data.name,
        currency: data.currency,
        buyIn: toFloat(data.buyIn),
        result:
          data.result.toLowerCase() === "ticket"
            ? "ticket"
            : toFloat(data.result),
        itm: data.itm ?? false,
        hasFt: data.hasFt ?? false,
        position: data.position ? parseInt(data.position) : null,
        type: data.type ? (data.type as Tournament["type"]) : undefined,
        speed: data.speed ? (data.speed as Tournament["speed"]) : undefined,
      },
      { onSuccess: () => setIsModalOpen(false) },
    );
  };

  const handleEdit = (data: TournamentFormData) => {
    if (!editingTournament?.id) return;
    const toFloat = (v: string) => parseFloat(v.replace(",", ".")) || 0;
    updateTournament.mutate(
      {
        id: editingTournament.id,
        data: {
          date: data.date,
          platform: data.platform,
          name: data.name,
          currency: data.currency,
          buyIn: toFloat(data.buyIn),
          result:
            data.result.toLowerCase() === "ticket"
              ? "ticket"
              : toFloat(data.result),
          itm: data.itm ?? false,
          hasFt: data.hasFt ?? false,
          position: data.position ? parseInt(data.position) : null,
          type: data.type ? (data.type as Tournament["type"]) : null,
          speed: data.speed ? (data.speed as Tournament["speed"]) : null,
        },
      },
      { onSuccess: () => setEditingTournament(undefined) },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.headerEyebrow}>{total} torneios</Text>
          <Text style={styles.headerTitle}>Torneios</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => setIsFiltersModalOpen(true)}
            style={[styles.addButton, { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: hasActiveExtraFilter ? "#d4a843" : "#2a2a2a" }]}
          >
            <Ionicons name="options-outline" size={18} color="#d4a843" />
          </Pressable>
          <Pressable
            onPress={() => setIsApplyModalOpen(true)}
            style={[styles.addButton, { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a" }]}
          >
            <Ionicons name="grid-outline" size={18} color="#d4a843" />
          </Pressable>
          <Pressable
            onPress={() => setIsModalOpen(true)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={22} color="#0a0a0a" />
          </Pressable>
        </View>
      </View>

      {/* Filtro por plataforma */}
      <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20, alignItems: 'center', flexGrow: 1 }}
        style={{ flex: 1 }}
      >
        {["", ...PLATFORMS].map((p) => (
          <Pressable
            key={p || "all"}
            onPress={() => {
              setPlatform(p);
              setPage(1);
            }}
            style={[
              styles.filterPill,
              platform === p
                ? styles.filterPillActive
                : styles.filterPillInactive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: platform === p ? "#d4a843" : "#888888" },
              ]}
            >
              {p || "Todos"}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      </View>

      {/* Lista */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color="#d4a843" />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={tournaments}
          keyExtractor={(item) => item.id ?? Math.random().toString()}
          renderItem={({ item }) => (
            <TournamentCard
              tournament={item}
              onDelete={(id) => deleteTournament.mutate(id)}
              onEdit={(t) => setEditingTournament(t)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#d4a843"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum torneio encontrado</Text>
            </View>
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <Pressable
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={[styles.pageButton, { opacity: page === 1 ? 0.4 : 1 }]}
                >
                  <Text style={styles.pageButtonText}>← Anterior</Text>
                </Pressable>
                <Text style={styles.pageIndicator}>
                  {page} / {totalPages}
                </Text>
                <Pressable
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={[
                    styles.pageButton,
                    { opacity: page === totalPages ? 0.4 : 1 },
                  ]}
                >
                  <Text style={styles.pageButtonText}>Próxima →</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      )}

      <CreateTournamentModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createTournament.isPending}
      />

      <CreateTournamentModal
        visible={!!editingTournament}
        onClose={() => setEditingTournament(undefined)}
        onSubmit={handleEdit}
        isLoading={updateTournament.isPending}
        tournament={editingTournament}
      />

      <ApplyScheduleModal
        visible={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onApply={async (scheduleId) => {
          await applySchedule.mutateAsync(scheduleId);
          setIsApplyModalOpen(false);
        }}
        isLoading={applySchedule.isPending}
      />

      <FiltersModal
        visible={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        type={type}
        onTypeChange={setType}
        speed={speed}
        onSpeedChange={setSpeed}
        minBuyInInput={minBuyInInput}
        onMinBuyInChange={setMinBuyInInput}
        maxBuyInInput={maxBuyInInput}
        onMaxBuyInChange={setMaxBuyInInput}
        onApply={applyFilters}
        onClear={clearExtraFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerEyebrow: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.62,
    color: "#555555",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5f5f5",
  },
  addButton: {
    backgroundColor: "#d4a843",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterContainer: {
    height: 44,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: "#d4a84320",
    borderColor: "#d4a843",
  },
  filterPillInactive: {
    backgroundColor: "#111111",
    borderColor: "#2a2a2a",
  },
  filterPillText: {
    fontSize: 12,
  },
  tournamentCard: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  tournamentName: {
    color: "#f5f5f5",
    fontWeight: "500",
    fontSize: 14,
  },
  tournamentMeta: {
    color: "#555555",
    fontSize: 11,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  badgePlatform: {
    fontSize: 9,
    fontWeight: "600",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    overflow: "hidden",
  },
  badgePlatformDefault: {
    fontSize: 9,
    color: "#888888",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  badgeType: {
    fontSize: 9,
    color: "#a78bfa",
    backgroundColor: "#a78bfa20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  badgeSpeed: {
    fontSize: 9,
    color: "#38bdf8",
    backgroundColor: "#38bdf820",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  cardResultSection: {
    alignItems: "flex-end",
  },
  profitText: {
    fontSize: 16,
    fontWeight: "600",
  },
  badgesRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
  },
  badgeItm: {
    fontSize: 9,
    backgroundColor: "#d4a84320",
    color: "#d4a843",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeFt: {
    fontSize: 9,
    backgroundColor: "#3b82f620",
    color: "#3b82f6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeGold: {
    fontSize: 9,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  buyInText: {
    color: "#555555",
    fontSize: 12,
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    color: "#555555",
    fontSize: 14,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 8,
  },
  pageButtonText: {
    color: "#888888",
    fontSize: 14,
  },
  pageIndicator: {
    color: "#555555",
    fontSize: 14,
  },
  // Modal styles
  modal: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  modalTitle: {
    color: "#f5f5f5",
    fontSize: 18,
    fontWeight: "600",
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formFields: {
    gap: 16,
  },
  fieldLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.44,
    color: "#888888",
    marginBottom: 8,
  },
  fieldError: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#f5f5f5",
    fontSize: 14,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: "#d4a84320",
    borderColor: "#d4a843",
  },
  pillInactive: {
    backgroundColor: "#111111",
    borderColor: "#2a2a2a",
  },
  pillText: {
    fontSize: 12,
  },
  currencyRow: {
    flexDirection: "row",
    gap: 8,
  },
  currencyPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  currencyText: {
    fontSize: 14,
    fontWeight: "500",
  },
  twoColumns: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 12,
  },
  toggle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  toggleActive: {
    backgroundColor: "#d4a84320",
    borderColor: "#d4a843",
  },
  toggleInactive: {
    backgroundColor: "#111111",
    borderColor: "#2a2a2a",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  submitButton: {
    backgroundColor: "#d4a843",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#0a0a0a",
    fontWeight: "600",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
});

const applyStyles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 3,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  tabActive: { backgroundColor: "#1a1a1a" },
  tabText: { fontSize: 13, color: "#555", fontWeight: "500" },
  tabTextActive: { color: "#f5f5f5" },
  list: { gap: 10, paddingHorizontal: 20 },
  scheduleCard: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scheduleCardActive: { borderColor: "#22c55e", backgroundColor: "#22c55e10" },
  scheduleCardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: "#2a2a2a",
    alignItems: "center", justifyContent: "center",
  },
  radioActive: { borderColor: "#22c55e" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22c55e" },
  scheduleName: { color: "#888", fontSize: 15 },
  scheduleNameActive: { color: "#f5f5f5", fontWeight: "600" },
  scheduleType: { color: "#555", fontSize: 12 },
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyText: { color: "#555", fontSize: 14 },
  emptySubtext: { color: "#333", fontSize: 12, marginTop: 4 },
});
