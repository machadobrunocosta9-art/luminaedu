import streamlit as st
from datetime import datetime

st.set_page_config(
    page_title="Girassol ERP",
    page_icon="🌻",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    [data-testid="stAppViewContainer"] {
        background-color: #F8F7F3;
    }

    [data-testid="stSidebar"] {
        background-color: #FFFFFF;
        border-right: 1px solid #EAEAEA;
    }

    .topbar {
        background: #FFFFFF;
        padding: 22px 28px;
        border-radius: 18px;
        border: 1px solid #E9E5DA;
        margin-bottom: 22px;
    }

    .brand-title {
        font-size: 28px;
        font-weight: 800;
        color: #2B2418;
    }

    .brand-subtitle {
        font-size: 14px;
        color: #8A7A64;
        margin-top: 4px;
    }

    .welcome {
        font-size: 32px;
        font-weight: 800;
        color: #1F2937;
        margin-bottom: 6px;
    }

    .date-text {
        color: #6B7280;
        font-size: 15px;
        margin-bottom: 22px;
    }

    .metric-card {
        background: #FFFFFF;
        padding: 24px;
        border-radius: 20px;
        border: 1px solid #E9E5DA;
        box-shadow: 0 8px 24px rgba(0,0,0,0.04);
        min-height: 170px;
    }

    .metric-label {
        font-size: 12px;
        font-weight: 800;
        color: #6B7280;
        text-transform: uppercase;
        letter-spacing: .04em;
    }

    .metric-value {
        font-size: 42px;
        font-weight: 900;
        color: #2B2418;
        margin-top: 14px;
    }

    .metric-desc {
        color: #6B7280;
        font-size: 14px;
        margin-top: 4px;
    }

    .metric-link {
        margin-top: 18px;
        font-size: 14px;
        font-weight: 700;
        color: #C88700;
    }

    .section-box {
        background: #FFFFFF;
        padding: 24px;
        border-radius: 20px;
        border: 1px solid #E9E5DA;
        box-shadow: 0 8px 24px rgba(0,0,0,0.04);
        margin-top: 22px;
    }

    .section-title {
        font-size: 20px;
        font-weight: 800;
        color: #2B2418;
        margin-bottom: 18px;
    }

    .action-card {
        background: #FAFAFA;
        border: 1px solid #E9E5DA;
        border-radius: 16px;
        padding: 22px;
        text-align: center;
        font-weight: 800;
        color: #2B2418;
    }

    .list-item {
        padding: 14px 0;
        border-bottom: 1px solid #EFEFEF;
        color: #374151;
        font-size: 15px;
    }

    .status-ok {
        background: #E8F8EE;
        color: #16833A;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
    }

    .status-alert {
        background: #FFF4DB;
        color: #B77900;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
    }
</style>
""", unsafe_allow_html=True)

# MENU LATERAL
st.sidebar.markdown("## Girassol ERP")
st.sidebar.caption("Gestão Escolar Inteligente")
st.sidebar.divider()

menu = st.sidebar.radio(
    "Navegação",
    [
        "Dashboard",
        "Alunos",
        "Responsáveis",
        "Turmas",
        "Presença",
        "Comunicados",
        "E-mails",
        "Documentos",
        "Financeiro",
        "Configurações"
    ]
)

if menu == "Dashboard":
    hoje = datetime.now().strftime("%d/%m/%Y")

    st.markdown("""
    <div class="topbar">
        <div class="brand-title">Girassol ERP</div>
        <div class="brand-subtitle">Jardim Escola Girassol Encantado • Gestão Escolar Inteligente</div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown('<div class="welcome">Bom dia, Bruno</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="date-text">Hoje, {hoje}</div>', unsafe_allow_html=True)

    col1, col2, col3, col4 = st.columns(4)

    cards = [
        ("Presença hoje", "0", "alunos presentes", "Ver detalhes"),
        ("Comunicados", "0", "pendentes de envio", "Ver comunicados"),
        ("Documentos", "0", "alunos com pendências", "Ver pendências"),
        ("Financeiro", "0", "mensalidades atrasadas", "Ver inadimplência"),
    ]

    for col, card in zip([col1, col2, col3, col4], cards):
        with col:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">{card[0]}</div>
                <div class="metric-value">{card[1]}</div>
                <div class="metric-desc">{card[2]}</div>
                <div class="metric-link">{card[3]}</div>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("""
    <div class="section-box">
        <div class="section-title">Ações rápidas</div>
    </div>
    """, unsafe_allow_html=True)

    a1, a2, a3, a4, a5 = st.columns(5)

    with a1:
        st.button("Novo aluno", use_container_width=True)

    with a2:
        st.button("Novo responsável", use_container_width=True)

    with a3:
        st.button("Novo comunicado", use_container_width=True)

    with a4:
        st.button("Emitir declaração", use_container_width=True)

    with a5:
        st.button("Enviar e-mail", use_container_width=True)

    col_left, col_center, col_right = st.columns(3)

    with col_left:
        st.markdown("""
        <div class="section-box">
            <div class="section-title">Últimos comunicados</div>
            <div class="list-item">Festa Julhina 2026 <span class="status-ok">Enviado</span></div>
            <div class="list-item">Horário especial - Jogo do Brasil <span class="status-ok">Enviado</span></div>
            <div class="list-item">Aula temática - Copa do Mundo <span class="status-ok">Enviado</span></div>
        </div>
        """, unsafe_allow_html=True)

    with col_center:
        st.markdown("""
        <div class="section-box">
            <div class="section-title">Próximos eventos</div>
            <div class="list-item">Reunião de pais - 30/06</div>
            <div class="list-item">Festa Julhina - 10/07</div>
            <div class="list-item">Exposição da Taça - 15/07</div>
        </div>
        """, unsafe_allow_html=True)

    with col_right:
        st.markdown("""
        <div class="section-box">
            <div class="section-title">Centro de atenção</div>
            <div class="list-item">Nenhum documento pendente.</div>
            <div class="list-item">Nenhuma mensalidade atrasada.</div>
            <div class="list-item">Nenhum comunicado aguardando envio.</div>
        </div>
        """, unsafe_allow_html=True)

else:
    st.markdown(f"""
    <div class="topbar">
        <div class="brand-title">{menu}</div>
        <div class="brand-subtitle">Módulo em desenvolvimento</div>
    </div>
    """, unsafe_allow_html=True)

    st.info("Esta tela será desenvolvida na próxima etapa.")
