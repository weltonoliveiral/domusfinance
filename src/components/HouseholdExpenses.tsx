import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function HouseholdExpenses() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  const [inviteData, setInviteData] = useState({
    email: "",
    permissions: ["view"],
  });

  const [memberData, setMemberData] = useState({
    name: "",
    email: "",
    role: "",
    monthlyBudget: "",
  });

  const expensesByPerson = useQuery(api.householdMembers.getExpensesByPerson, { month: currentMonth });
  const sharedHouseholds = useQuery(api.householdSharing.getSharedHouseholds);
  const pendingInvites = useQuery(api.householdSharing.getPendingInvites);
  const householdMembers = useQuery(api.householdMembers.getHouseholdMembers);

  const inviteUser = useMutation(api.householdSharing.inviteUserToHousehold);
  const acceptInvite = useMutation(api.householdSharing.acceptHouseholdInvite);
  const rejectInvite = useMutation(api.householdSharing.rejectHouseholdInvite);
  const createMember = useMutation(api.householdMembers.createHouseholdMember);
  const updateMember = useMutation(api.householdMembers.updateHouseholdMember);
  const deleteMember = useMutation(api.householdMembers.deleteHouseholdMember);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteData.email) {
      toast.error("Email é obrigatório");
      return;
    }

    try {
      await inviteUser({
        email: inviteData.email,
        permissions: inviteData.permissions,
      });
      
      toast.success("Convite enviado com sucesso!");
      setShowInviteModal(false);
      setInviteData({ email: "", permissions: ["view"] });
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar convite");
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      await acceptInvite({ inviteId: inviteId as any });
      toast.success("Convite aceito!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao aceitar convite");
    }
  };

  const handleRejectInvite = async (inviteId: string) => {
    try {
      await rejectInvite({ inviteId: inviteId as any });
      toast.success("Convite rejeitado");
    } catch (error: any) {
      toast.error(error.message || "Erro ao rejeitar convite");
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      const data = {
        name: memberData.name,
        email: memberData.email || undefined,
        role: memberData.role || undefined,
        monthlyBudget: memberData.monthlyBudget ? parseFloat(memberData.monthlyBudget) : undefined,
      };

      if (editingMember) {
        await updateMember({
          memberId: editingMember._id,
          ...data,
        });
        toast.success("Membro atualizado!");
      } else {
        await createMember(data);
        toast.success("Membro adicionado!");
      }
      
      setShowMemberModal(false);
      setEditingMember(null);
      setMemberData({ name: "", email: "", role: "", monthlyBudget: "" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar membro");
    }
  };

  const handleEditMember = (member: any) => {
    setEditingMember(member);
    setMemberData({
      name: member.name,
      email: member.email || "",
      role: member.role || "",
      monthlyBudget: member.monthlyBudget?.toString() || "",
    });
    setShowMemberModal(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (confirm("Tem certeza que deseja excluir este membro?")) {
      try {
        await deleteMember({ memberId: memberId as any });
        toast.success("Membro excluído!");
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir membro");
      }
    }
  };

  if (!expensesByPerson || !sharedHouseholds || !pendingInvites || !householdMembers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalHouseholdExpenses = expensesByPerson.reduce((sum, person) => sum + person.totalExpenses, 0);

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-0">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-3 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              Gastos da Casa
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
              {getMonthName(currentMonth)} • Total: {formatCurrency(totalHouseholdExpenses)}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full lg:w-auto">
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="w-full sm:flex-1 lg:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
            />
            <button
              onClick={() => setShowMemberModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm lg:text-base"
            >
              Novo Membro
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm lg:text-base"
            >
              Convidar
            </button>
          </div>
        </div>
      </div>

      {/* Convites Pendentes */}
      {pendingInvites.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
            Convites Pendentes
          </h3>
          <div className="space-y-2">
            {(pendingInvites || []).map((invite: any) => (
              <div key={invite._id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-800 p-3 rounded space-y-2 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {invite.owner?.name || invite.owner?.email}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Quer compartilhar gastos com você
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptInvite(invite._id)}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Aceitar
                  </button>
                  <button
                    onClick={() => handleRejectInvite(invite._id)}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gastos por Pessoa */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gastos por Pessoa Responsável
          </h3>
        </div>
        
        <div className="p-4 sm:p-6">
          {expensesByPerson.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {expensesByPerson.map((personData) => (
                <div key={personData.person._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate flex-1 mr-2">
                      {personData.person.name}
                    </h4>
                    {personData.person._id !== "no-person" && (
                      <div className="flex space-x-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditMember(personData.person)}
                          className="text-blue-600 hover:text-blue-700 text-sm px-2 py-1"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteMember(personData.person._id)}
                          className="text-red-600 hover:text-red-700 text-sm px-2 py-1"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Gasto:</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {formatCurrency(personData.totalExpenses)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Despesas:</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {personData.expenseCount}
                      </span>
                    </div>

                    {personData.budgetLimit > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Orçamento:</span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {formatCurrency(personData.budgetLimit)}
                          </span>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Uso do Orçamento</span>
                            <span className={`font-medium ${
                              personData.budgetStatus === 'exceeded' ? 'text-red-600' :
                              personData.budgetStatus === 'warning' ? 'text-yellow-600' :
                              personData.budgetStatus === 'caution' ? 'text-orange-600' :
                              'text-green-600'
                            }`}>
                              {personData.budgetPercentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                personData.budgetStatus === 'exceeded' ? 'bg-red-500' :
                                personData.budgetStatus === 'warning' ? 'bg-yellow-500' :
                                personData.budgetStatus === 'caution' ? 'bg-orange-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(personData.budgetPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {totalHouseholdExpenses > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">% do Total da Casa:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {((personData.totalExpenses / totalHouseholdExpenses) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm sm:text-base">
              Nenhuma despesa encontrada para este mês
            </p>
          )}
        </div>
      </div>

      {/* Usuários Compartilhados */}
      {sharedHouseholds.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Compartilhamento de Gastos
            </h3>
          </div>
          
          <div className="p-4 sm:p-6">
            <div className="space-y-3">
              {(sharedHouseholds || []).map((household: any) => (
                <div key={household._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded space-y-2 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {household.user?.name || household.user?.email}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {household.role === 'owner' ? 'Você convidou' : 'Convidou você'} • 
                      Permissões: {household.permissions.join(', ')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    household.role === 'owner' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {household.role === 'owner' ? 'Proprietário' : 'Membro'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Convidar Usuário */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Convidar Usuário
            </h3>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <input
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                placeholder="Email do usuário"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Permissões
                </label>
                <div className="space-y-2">
                  {["view", "edit", "manage"].map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={inviteData.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setInviteData({
                              ...inviteData,
                              permissions: [...inviteData.permissions, permission]
                            });
                          } else {
                            setInviteData({
                              ...inviteData,
                              permissions: inviteData.permissions.filter(p => p !== permission)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {permission === 'view' ? 'Visualizar' : 
                         permission === 'edit' ? 'Editar' : 'Gerenciar'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 text-sm sm:text-base"
                >
                  Enviar Convite
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 text-sm sm:text-base"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Membro */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingMember ? 'Editar Membro' : 'Novo Membro'}
            </h3>
            <form onSubmit={handleSaveMember} className="space-y-4">
              <input
                type="text"
                value={memberData.name}
                onChange={(e) => setMemberData({ ...memberData, name: e.target.value })}
                placeholder="Nome do membro"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                required
              />
              
              <input
                type="email"
                value={memberData.email}
                onChange={(e) => setMemberData({ ...memberData, email: e.target.value })}
                placeholder="Email (opcional)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
              />
              
              <input
                type="text"
                value={memberData.role}
                onChange={(e) => setMemberData({ ...memberData, role: e.target.value })}
                placeholder="Função (ex: Pai, Mãe, Filho)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
              />
              
              <input
                type="number"
                step="0.01"
                min="0"
                value={memberData.monthlyBudget}
                onChange={(e) => setMemberData({ ...memberData, monthlyBudget: e.target.value })}
                placeholder="Orçamento mensal (R$)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
              />

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                >
                  {editingMember ? 'Atualizar' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMemberModal(false);
                    setEditingMember(null);
                    setMemberData({ name: "", email: "", role: "", monthlyBudget: "" });
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 text-sm sm:text-base"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
