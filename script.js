<script>
    let produtos = [];
    let defeitos = [];
    let registros = [];
    let quarentena = [];
    let usuarios = [{ usuario: 'admin', senha: '1234', nivel: 'admin' }];
    let usuarioLogado = null;
    let chartInstance = null;
    
    // Variáveis para a tela High
    let servicos = [];
    let funcionarios = [];
    let registrosServicos = [];
    let timerAtivo = null;
    let tempoInicio = null;
    let servicoAtual = null;

    function salvarLocal() {
      localStorage.setItem("produtos", JSON.stringify(produtos));
      localStorage.setItem("defeitos", JSON.stringify(defeitos));
      localStorage.setItem("registros", JSON.stringify(registros));
      localStorage.setItem("quarentena", JSON.stringify(quarentena));
      localStorage.setItem("usuarios", JSON.stringify(usuarios));
      localStorage.setItem("servicos", JSON.stringify(servicos));
      localStorage.setItem("funcionarios", JSON.stringify(funcionarios));
      localStorage.setItem("registrosServicos", JSON.stringify(registrosServicos));
    }

    function carregarLocal() {
      produtos = JSON.parse(localStorage.getItem("produtos")) || [];
      defeitos = JSON.parse(localStorage.getItem("defeitos")) || [];
      registros = JSON.parse(localStorage.getItem("registros")) || [];
      quarentena = JSON.parse(localStorage.getItem("quarentena")) || [];
      usuarios = JSON.parse(localStorage.getItem("usuarios")) || [{ usuario: 'admin', senha: '1234', nivel: 'admin' }];
      servicos = JSON.parse(localStorage.getItem("servicos")) || [];
      funcionarios = JSON.parse(localStorage.getItem("funcionarios")) || [];
      registrosServicos = JSON.parse(localStorage.getItem("registrosServicos")) || [];
      
      atualizarTabelaProdutos();
      atualizarTabelaDefeitos();
      atualizarTabelaQuarentena();
      atualizarListaServicos();
      atualizarListaFuncionarios();
      atualizarHistorico();
    }

    function mostrarTela(id) {
      if (!usuarioLogado && id !== 'login' && id !== 'criarUsuario') {
        alert('Você precisa fazer login para acessar essa página.');
        return;
      }
      
      document.querySelectorAll('.tela').forEach(t => t.style.display = 'none');
      document.getElementById(id).style.display = 'block';
      
      if (id === 'registro') atualizarSelects();
      if (id === 'relatorio') gerarRelatorioCompleto();
      if (id === 'graficos') gerarGraficos();
      if (id === 'quarentena') {
        atualizarSelectProdutoQuarentena();
        atualizarTabelaQuarentena();
      }
      if (id === 'high') {
        atualizarListaServicos();
        atualizarListaFuncionarios();
        atualizarHistorico();
      }
    }

    function login() {
      const usuario = document.getElementById('usuario').value;
      const senha = document.getElementById('senha').value;
      const usuarioEncontrado = usuarios.find(u => u.usuario === usuario && u.senha === senha);
      
      if (usuarioEncontrado) {
        usuarioLogado = usuarioEncontrado;
        mostrarTela('cadastroProduto');
      } else {
        alert('Usuário ou senha incorretos!');
      }
    }

    function logout() {
      usuarioLogado = null;
      mostrarTela('login');
    }

    function criarUsuario() {
      const novoUsuario = document.getElementById('novoUsuario').value.trim();
      const novaSenha = document.getElementById('novaSenha').value;
      const confirmarSenha = document.getElementById('confirmarSenha').value;
      
      if (!novoUsuario || !novaSenha) {
        alert('Preencha todos os campos!');
        return;
      }
      
      if (novaSenha !== confirmarSenha) {
        alert('As senhas não coincidem!');
        return;
      }
      
      if (usuarios.some(u => u.usuario === novoUsuario)) {
        alert('Usuário já existe!');
        return;
      }
      
      usuarios.push({
        usuario: novoUsuario,
        senha: novaSenha,
        nivel: 'usuario'
      });
      
      salvarLocal();
      alert('Usuário criado com sucesso!');
      document.getElementById('novoUsuario').value = '';
      document.getElementById('novaSenha').value = '';
      document.getElementById('confirmarSenha').value = '';
      mostrarTela('login');
    }

    function cadastrarProduto() {
      const nome = document.getElementById('novoProduto').value.trim();
      const codigo = document.getElementById('codigoProduto').value.trim();
      if (nome && codigo && !produtos.some(p => p.codigo === codigo)) {
        produtos.push({ nome, codigo });
        salvarLocal();
        alert('Produto cadastrado!');
        document.getElementById('novoProduto').value = '';
        document.getElementById('codigoProduto').value = '';
        atualizarTabelaProdutos();
      }
    }

    function importarProdutos(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        const lines = e.target.result.split('\\n');
        for (const line of lines) {
          const nome = line.trim();
          if (nome) {
            const codigo = 'P' + Date.now() + Math.floor(Math.random() * 1000);
            if (!produtos.some(p => p.nome.toLowerCase() === nome.toLowerCase())) {
              produtos.push({ codigo, nome });
            }
          }
        }
        salvarLocal();
        atualizarTabelaProdutos();
      };
      reader.readAsText(file);
    }

    function excluirProdutosImportados() {
      if (confirm("Deseja excluir todos os produtos importados?")) {
        produtos = [];
        salvarLocal();
        atualizarTabelaProdutos();
      }
    }

    function cadastrarDefeito() {
      const novo = document.getElementById('novoDefeito').value.trim();
      if (novo && !defeitos.includes(novo)) {
        defeitos.push(novo);
        salvarLocal();
        alert('Defeito cadastrado!');
        document.getElementById('novoDefeito').value = '';
        atualizarTabelaDefeitos();
      }
    }

    function importarDefeitos() {
      const fileInput = document.getElementById('importDefeitos');
      const file = fileInput.files[0];
      
      if (!file) {
        alert('Selecione um arquivo primeiro!');
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        const lines = e.target.result.split('\\n');
        let count = 0;
        
        for (const line of lines) {
          const defeito = line.trim();
          if (defeito && !defeitos.includes(defeito)) {
            defeitos.push(defeito);
            count++;
          }
        }
        
        salvarLocal();
        atualizarTabelaDefeitos();
        alert(`${count} defeitos importados com sucesso!`);
        fileInput.value = '';
      };
      reader.readAsText(file);
    }

    function excluirDefeitosImportados() {
      if (confirm("Deseja excluir todos os defeitos cadastrados?")) {
        defeitos = [];
        salvarLocal();
        atualizarTabelaDefeitos();
        alert("Todos os defeitos foram removidos.");
      }
    }

    function atualizarSelects() {
      const prod = document.getElementById('selectProduto');
      const def = document.getElementById('selectDefeito');
      prod.innerHTML = `<option value="">Selecione o produto</option>` + produtos.map(p => `<option value="${p.codigo}">${p.nome}</option>`).join('');
      def.innerHTML = `<option value="">Selecione o defeito</option>` + defeitos.map(d => `<option>${d}</option>`).join('');
      document.getElementById('quantidade').value = '';
    }

    function atualizarSelectProdutoQuarentena() {
      const select = document.getElementById('selectProdutoQuarentena');
      select.innerHTML = `<option value="">Selecione o produto</option>` + produtos.map(p => `<option value="${p.codigo}">${p.nome}</option>`).join('');
      document.getElementById('quantidadeQuarentena').value = '';
      document.getElementById('quantidadeVazou').value = '';
      document.getElementById('quandoVazou').value = '';
    }

    function registrarDefeito() {
      const produtoCodigo = document.getElementById('selectProduto').value;
      const produto = produtos.find(p => p.codigo === produtoCodigo);
      const defeito = document.getElementById('selectDefeito').value;
      const quantidade = parseInt(document.getElementById('quantidade').value);
      if (produto && defeito && quantidade > 0) {
        registros.push({ 
          produto: produto.nome, 
          produtoCodigo: produto.codigo,
          defeito, 
          quantidade, 
          data: new Date().toLocaleString(),
          dataISO: new Date().toISOString()
        });
        salvarLocal();
        alert('Registro salvo!');
        atualizarSelects();
      } else {
        alert("Preencha todos os campos corretamente.");
      }
    }

    function registrarQuarentena() {
      const produtoCodigo = document.getElementById('selectProdutoQuarentena').value;
      const produto = produtos.find(p => p.codigo === produtoCodigo);
      const quantidade = parseInt(document.getElementById('quantidadeQuarentena').value);
      const quantidadeVazou = parseInt(document.getElementById('quantidadeVazou').value);
      const quandoVazou = document.getElementById('quandoVazou').value.trim();
      
      if (produto && quantidade > 0 && quantidadeVazou >= 0 && quandoVazou) {
        quarentena.push({
          produto: produto.nome,
          produtoCodigo: produto.codigo,
          quantidade,
          quantidadeVazou,
          quandoVazou,
          data: new Date().toLocaleString(),
          dataISO: new Date().toISOString()
        });
        salvarLocal();
        alert('Registro de quarentena salvo!');
        atualizarSelectProdutoQuarentena();
        atualizarTabelaQuarentena();
      } else {
        alert("Preencha todos os campos corretamente.");
      }
    }

    function gerarRelatorioCompleto() {
      const container = document.getElementById('relatorioContainer');
      
      // Aplicar filtros
      const filtroProduto = document.getElementById('filtroProduto')?.value || '';
      const filtroDefeito = document.getElementById('filtroDefeito')?.value || '';
      const filtroDataInicio = document.getElementById('filtroDataInicio')?.value || '';
      const filtroDataFim = document.getElementById('filtroDataFim')?.value || '';

      let registrosFiltrados = [...registros];

      if (filtroProduto) {
        registrosFiltrados = registrosFiltrados.filter(r => r.produtoCodigo === filtroProduto);
      }

      if (filtroDefeito) {
        registrosFiltrados = registrosFiltrados.filter(r => r.defeito === filtroDefeito);
      }

      if (filtroDataInicio) {
        const dataInicio = new Date(filtroDataInicio);
        registrosFiltrados = registrosFiltrados.filter(r => new Date(r.dataISO) >= dataInicio);
      }

      if (filtroDataFim) {
        const dataFim = new Date(filtroDataFim);
        registrosFiltrados = registrosFiltrados.filter(r => new Date(r.dataISO) <= dataFim);
      }

      // Calcular totais
      const totalDefeitos = registrosFiltrados.reduce((sum, r) => sum + r.quantidade, 0);
      const totalRegistros = registrosFiltrados.length;

      // Gerar HTML para o relatório completo
      container.innerHTML = `
        <div class="filter-container">
          <h3>Filtros</h3>
          <label>Produto:
            <select id="filtroProduto" onchange="gerarRelatorioCompleto()">
              <option value="">Todos</option>
              ${produtos.map(p => `<option value="${p.codigo}">${p.nome}</option>`).join('')}
            </select>
          </label>
          <label>Defeito:
            <select id="filtroDefeito" onchange="gerarRelatorioCompleto()">
              <option value="">Todos</option>
              ${defeitos.map(d => `<option>${d}</option>`).join('')}
            </select>
          </label>
          <label>Data Início:
            <input id="filtroDataInicio" type="date" onchange="gerarRelatorioCompleto()" />
          </label>
          <label>Data Fim:
            <input id="filtroDataFim" type="date" onchange="gerarRelatorioCompleto()" />
          </label>
          <p>Total de registros: ${totalRegistros} | Total de defeitos: ${totalDefeitos}</p>
        </div>
        
        <div class="data-section">
          <div class="data-column">
            <h3>Registros de Defeitos</h3>
            ${gerarTabelaRegistros(registrosFiltrados)}
          </div>
          
          <div class="data-column">
            <h3>Lista de Defeitos Cadastrados</h3>
            ${gerarTabelaDefeitosRelatorio()}
          </div>
        </div>
        
        <div style="margin-top: 20px;">
          <button onclick='exportarExcel()'>Exportar para Excel</button>
          <button onclick='exportarTXT()'>Exportar para TXT</button>
          ${usuarioLogado.nivel === 'admin' ? `<button class='danger' onclick='excluirTodosRegistros()'>Excluir Todos Lançamentos</button>` : ''}
        </div>
      `;

      // Aplicar os valores dos filtros
      if (filtroProduto) document.getElementById('filtroProduto').value = filtroProduto;
      if (filtroDefeito) document.getElementById('filtroDefeito').value = filtroDefeito;
      if (filtroDataInicio) document.getElementById('filtroDataInicio').value = filtroDataInicio;
      if (filtroDataFim) document.getElementById('filtroDataFim').value = filtroDataFim;
    }

    function gerarTabelaRegistros(registrosFiltrados) {
      if (registrosFiltrados.length === 0) {
        return "<p>Nenhum registro encontrado com os filtros aplicados.</p>";
      }

      let html = `<table>
        <tr>
          <th>Data</th>
          <th>Produto</th>
          <th>Defeito</th>
          <th>Quantidade</th>
          ${usuarioLogado.nivel === 'admin' ? '<th>Ações</th>' : ''}
        </tr>`;

      registrosFiltrados.forEach((r, index) => {
        html += `<tr>
          <td>${r.data}</td>
          <td>${r.produto}</td>
          <td>${r.defeito}</td>
          <td>${r.quantidade}</td>
          ${usuarioLogado.nivel === 'admin' ? `<td><button class="danger" onclick="excluirRegistro(${index})">Excluir</button></td>` : ''}
        </tr>`;
      });

      html += "</table>";
      return html;
    }

    function gerarTabelaDefeitosRelatorio() {
      if (defeitos.length === 0) {
        return "<p>Nenhum defeito cadastrado.</p>";
      }

      // Calcular estatísticas de defeitos
      const defeitosComContagem = defeitos.map(defeito => {
        const total = registros.reduce((sum, r) => r.defeito === defeito ? sum + r.quantidade : sum, 0);
        return { defeito, total };
      }).sort((a, b) => b.total - a.total);

      let html = `<table>
        <tr>
          <th>Defeito</th>
          <th>Total Ocorrências</th>
          ${usuarioLogado.nivel === 'admin' ? '<th>Ações</th>' : ''}
        </tr>`;

      defeitosComContagem.forEach(d => {
        html += `<tr>
          <td>${d.defeito}</td>
          <td>${d.total}</td>
          ${usuarioLogado.nivel === 'admin' ? `<td><button class="danger" onclick="excluirDefeito('${d.defeito}'); gerarRelatorioCompleto();">Excluir</button></td>` : ''}
        </tr>`;
      });

      html += "</table>";
      return html;
    }

    function atualizarTabelaQuarentena() {
      const tabela = document.getElementById('tabelaQuarentena');
      if (quarentena.length === 0) {
        tabela.innerHTML = "<p>Nenhum item em quarentena registrado.</p>";
        return;
      }

      let html = `<table>
        <tr>
          <th>Data</th>
          <th>Produto</th>
          <th>Quantidade</th>
          <th>Quantidade que Vazou</th>
          <th>Quando Vazou</th>
          ${usuarioLogado.nivel === 'admin' ? '<th>Ações</th>' : ''}
        </tr>`;

      quarentena.forEach((q, index) => {
        html += `<tr>
          <td>${q.data}</td>
          <td>${q.produto}</td>
          <td>${q.quantidade}</td>
          <td>${q.quantidadeVazou}</td>
          <td>${q.quandoVazou}</td>
          ${usuarioLogado.nivel === 'admin' ? `<td><button class="danger" onclick="excluirRegistroQuarentena(${index})">Excluir</button></td>` : ''}
        </tr>`;
      });

      html += "</table>";
      tabela.innerHTML = html;
    }

    function excluirRegistroQuarentena(index) {
      if (confirm("Deseja realmente excluir este registro de quarentena?")) {
        quarentena.splice(index, 1);
        salvarLocal();
        atualizarTabelaQuarentena();
      }
    }

    function gerarGraficos() {
      const container = document.getElementById('graficosContainer');
      
      // Destruir gráfico anterior se existir
      if (chartInstance) {
        chartInstance.destroy();
      }
      
      // Agrupar dados para os gráficos
      const dadosPorProduto = {};
      const dadosPorDefeito = {};
      const dadosPorData = {};
      
      registros.forEach(registro => {
        // Por produto
        if (!dadosPorProduto[registro.produto]) {
          dadosPorProduto[registro.produto] = 0;
        }
        dadosPorProduto[registro.produto] += registro.quantidade;
        
        // Por defeito
        if (!dadosPorDefeito[registro.defeito]) {
          dadosPorDefeito[registro.defeito] = 0;
        }
        dadosPorDefeito[registro.defeito] += registro.quantidade;
        
        // Por data (agrupar por dia)
        const data = new Date(registro.dataISO).toLocaleDateString();
        if (!dadosPorData[data]) {
          dadosPorData[data] = 0;
        }
        dadosPorData[data] += registro.quantidade;
      });
      
      // Ordenar dados
      const produtosOrdenados = Object.entries(dadosPorProduto)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      const defeitosOrdenados = Object.entries(dadosPorDefeito)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      const datasOrdenadas = Object.entries(dadosPorData)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]));
      
      // Criar HTML para os gráficos
      container.innerHTML = `
        <div class="filter-container">
          <h3>Relatórios Gráficos</h3>
          <p>Visualização dos dados de defeitos registrados</p>
        </div>
        
        <div class="chart-container">
          <h3>Top 10 Produtos com Mais Defeitos</h3>
          <canvas id="chartProdutos"></canvas>
        </div>
        
        <div class="chart-container">
          <h3>Top 10 Defeitos Mais Frequentes</h3>
          <canvas id="chartDefeitos"></canvas>
        </div>
        
        <div class="chart-container">
          <h3>Evolução de Defeitos ao Longo do Tempo</h3>
          <canvas id="chartTemporal"></canvas>
        </div>
      `;
      
      // Gráfico de produtos
      const ctxProdutos = document.getElementById('chartProdutos').getContext('2d');
      new Chart(ctxProdutos, {
        type: 'bar',
        data: {
          labels: produtosOrdenados.map(item => item[0]),
          datasets: [{
            label: 'Quantidade de Defeitos',
            data: produtosOrdenados.map(item => item[1]),
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      
      // Gráfico de defeitos
      const ctxDefeitos = document.getElementById('chartDefeitos').getContext('2d');
      new Chart(ctxDefeitos, {
        type: 'pie',
        data: {
          labels: defeitosOrdenados.map(item => item[0]),
          datasets: [{
            label: 'Quantidade de Defeitos',
            data: defeitosOrdenados.map(item => item[1]),
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)',
              'rgba(199, 199, 199, 0.7)',
              'rgba(83, 102, 255, 0.7)',
              'rgba(40, 159, 64, 0.7)',
              'rgba(210, 99, 132, 0.7)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true
        }
      });
      
      // Gráfico temporal
      const ctxTemporal = document.getElementById('chartTemporal').getContext('2d');
      chartInstance = new Chart(ctxTemporal, {
        type: 'line',
        data: {
          labels: datasOrdenadas.map(item => item[0]),
          datasets: [{
            label: 'Defeitos por Dia',
            data: datasOrdenadas.map(item => item[1]),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            tension: 0.1,
            fill: true
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    function excluirRegistro(index) {
      if (confirm("Deseja realmente excluir este registro?")) {
        registros.splice(index, 1);
        salvarLocal();
        gerarRelatorioCompleto();
      }
    }

    function excluirTodosRegistros() {
      if (confirm("Deseja realmente excluir TODOS os registros de defeitos?")) {
        registros = [];
        salvarLocal();
        gerarRelatorioCompleto();
      }
    }

    function exportarExcel() {
      const filtroProduto = document.getElementById('filtroProduto')?.value || '';
      const filtroDefeito = document.getElementById('filtroDefeito')?.value || '';
      const filtroDataInicio = document.getElementById('filtroDataInicio')?.value || '';
      const filtroDataFim = document.getElementById('filtroDataFim')?.value || '';

      let registrosFiltrados = [...registros];

      if (filtroProduto) {
        registrosFiltrados = registrosFiltrados.filter(r => r.produtoCodigo === filtroProduto);
      }

      if (filtroDefeito) {
        registrosFiltrados = registrosFiltrados.filter(r => r.defeito === filtroDefeito);
      }

      if (filtroDataInicio) {
        const dataInicio = new Date(filtroDataInicio);
        registrosFiltrados = registrosFiltrados.filter(r => new Date(r.dataISO) >= dataInicio);
      }

      if (filtroDataFim) {
        const dataFim = new Date(filtroDataFim);
        registrosFiltrados = registrosFiltrados.filter(r => new Date(r.dataISO) <= dataFim);
      }

      if (registrosFiltrados.length === 0) {
        alert("Nenhum registro para exportar com os filtros aplicados.");
        return;
      }

      let csvContent = "data:text/csv;charset=utf-8,Data,Produto,Defeito,Quantidade\n" +
        registrosFiltrados.map(r => `${r.data},${r.produto},${r.defeito},${r.quantidade}`).join("\n");

      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = `relatorio_defeitos_klz_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert(`Relatório exportado com ${registrosFiltrados.length} registros!`);
    }

    function exportarTXT() {
      const filtroProduto = document.getElementById('filtroProduto')?.value || '';
      const filtroDefeito = document.getElementById('filtroDefeito')?.value || '';
      const filtroDataInicio = document.getElementById('filtroDataInicio')?.value || '';
      const filtroDataFim = document.getElementById('filtroDataFim')?.value || '';

      let registrosFiltrados = [...registros];

      if (filtroProduto) {
        registrosFiltrados = registrosFiltrados.filter(r => r.produtoCodigo === filtroProduto);
      }

      if (filtroDefeito) {
        registrosFiltrados = registrosFiltrados.filter(r => r.defeito === filtroDefeito);
      }

      if (filtroDataInicio) {
        const dataInicio = new Date(filtroDataInicio);
        registrosFiltrados = registrosFiltrados.filter(r => new Date(r.dataISO) >= dataInicio);
      }

      if (filtroDataFim) {
        const dataFim = new Date(filtroDataFim);
        registrosFiltrados = registrosFiltrados.filter(r => new Date(r.dataISO) <= dataFim);
      }

      if (registrosFiltrados.length === 0) {
        alert("Nenhum registro para exportar com os filtros aplicados.");
        return;
      }

      let content = "Data | Produto | Defeito | Quantidade\n---------------------------------------\n" +
        registrosFiltrados.map(r => `${r.data} | ${r.produto} | ${r.defeito} | ${r.quantidade}`).join("\n");

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio_defeitos_klz_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert(`Relatório TXT exportado com ${registrosFiltrados.length} registros!`);
    }

    function limparDados() {
      if (confirm("Deseja realmente apagar todos os dados? Isso não pode ser desfeito!")) {
        localStorage.clear();
        produtos = [];
        defeitos = [];
        registros = [];
        quarentena = [];
        usuarios = [{ usuario: 'admin', senha: '1234', nivel: 'admin' }];
        servicos = [];
        funcionarios = [];
        registrosServicos = [];
        usuarioLogado = null;
        atualizarTabelaProdutos();
        atualizarTabelaDefeitos();
        atualizarTabelaQuarentena();
        atualizarListaServicos();
        atualizarListaFuncionarios();
        atualizarHistorico();
        alert("Todos os dados foram apagados.");
        mostrarTela('login');
      }
    }

    function atualizarTabelaProdutos() {
      const tabela = document.getElementById('tabelaProdutos');
      if (produtos.length === 0) {
        tabela.innerHTML = "<p>Nenhum produto cadastrado.</p>";
        return;
      }
      let html = "<table><tr><th>Código</th><th>Produto</th>";
      
      if (usuarioLogado && usuarioLogado.nivel === 'admin') {
        html += "<th>Ações</th>";
      }
      
      html += "</tr>";
      
      produtos.forEach(p => {
        html += `<tr><td>${p.codigo}</td><td>${p.nome}</td>`;
        
        if (usuarioLogado && usuarioLogado.nivel === 'admin') {
          html += `<td><button class="danger" onclick="excluirProduto('${p.codigo}')">Excluir</button></td>`;
        }
        
        html += `</tr>`;
      });
      
      html += "</table>";
      tabela.innerHTML = html;
    }

    function excluirProduto(codigo) {
      produtos = produtos.filter(p => p.codigo !== codigo);
      salvarLocal();
      atualizarTabelaProdutos();
    }

    function atualizarTabelaDefeitos() {
      const tabela = document.getElementById('tabelaDefeitos');
      if (defeitos.length === 0) {
        tabela.innerHTML = "<p>Nenhum defeito cadastrado.</p>";
        return;
      }
      let html = "<table><tr><th>Defeito</th>";
      
      if (usuarioLogado && usuarioLogado.nivel === 'admin') {
        html += "<th>Ações</th>";
      }
      
      html += "</tr>";
      
      defeitos.forEach(d => {
        html += `<tr><td>${d}</td>`;
        
        if (usuarioLogado && usuarioLogado.nivel === 'admin') {
          html += `<td><button class="danger" onclick="excluirDefeito('${d}')">Excluir</button></td>`;
        }
        
        html += `</tr>`;
      });
      
      html += "</table>";
      tabela.innerHTML = html;
    }

    function excluirDefeito(defeito) {
      defeitos = defeitos.filter(d => d !== defeito);
      salvarLocal();
      atualizarTabelaDefeitos();
      if (document.getElementById('relatorioContainer')) {
        gerarRelatorioCompleto();
      }
    }

    // Funções para a tela High
    function atualizarListaServicos() {
      const lista = document.getElementById('listaServicos');
      lista.innerHTML = servicos.map(servico => 
        `<div class="servico-item ${servico === servicoAtual ? 'servico-ativo' : ''}" 
              onclick="selecionarServico('${servico}')">
          ${servico}
        </div>`
      ).join('');
    }

    function atualizarListaFuncionarios() {
      const select = document.getElementById('selectFuncionario');
      select.innerHTML = `<option value="">Selecione o funcionário</option>` + 
        funcionarios.map(f => `<option>${f}</option>`).join('');
    }

    function cadastrarServico() {
      const novoServico = document.getElementById('novoServico').value.trim();
      if (novoServico && !servicos.includes(novoServico)) {
        servicos.push(novoServico);
        salvarLocal();
        document.getElementById('novoServico').value = '';
        atualizarListaServicos();
      }
    }

    function adicionarFuncionario() {
      const nome = prompt("Digite o nome do funcionário:");
      if (nome && !funcionarios.includes(nome)) {
        funcionarios.push(nome);
        salvarLocal();
        atualizarListaFuncionarios();
      }
    }

    function selecionarServico(servico) {
      if (timerAtivo) {
        if (!confirm('Já há um serviço em andamento. Deseja parar e iniciar um novo?')) return;
        finalizarServico();
      }
      
      servicoAtual = servico;
      atualizarListaServicos();
      document.getElementById('servicoAtualInfo').textContent = `Serviço selecionado: ${servico}`;
      document.getElementById('btnIniciarParar').textContent = 'Iniciar Serviço';
    }

    function iniciarPararServico() {
      const funcionario = document.getElementById('selectFuncionario').value;
      if (!funcionario) {
        alert('Selecione um funcionário primeiro!');
        return;
      }
      
      if (!servicoAtual) {
        alert('Selecione um serviço primeiro!');
        return;
      }

      if (timerAtivo) {
        // Pausar o serviço
        clearInterval(timerAtivo);
        timerAtivo = null;
        document.getElementById('btnIniciarParar').textContent = 'Continuar Serviço';
        document.getElementById('btnFinalizar').style.display = 'inline-block';
      } else {
        // Iniciar/continuar o serviço
        if (!tempoInicio) tempoInicio = new Date();
        timerAtivo = setInterval(atualizarTimer, 1000);
        document.getElementById('btnIniciarParar').textContent = 'Pausar Serviço';
        document.getElementById('btnFinalizar').style.display = 'inline-block';
        atualizarTimer();
      }
    }

    function atualizarTimer() {
      if (!tempoInicio) return;
      
      const agora = new Date();
      const diferenca = agora - tempoInicio;
      const horas = Math.floor(diferenca / 3600000);
      const minutos = Math.floor((diferenca % 3600000) / 60000);
      const segundos = Math.floor((diferenca % 60000) / 1000);
      
      document.getElementById('timerDisplay').textContent = 
        `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    }

    function finalizarServico() {
      const funcionario = document.getElementById('selectFuncionario').value;
      const quantidade = parseInt(document.getElementById('quantidadeProduzida').value);
      if (isNaN(quantidade) || quantidade <= 0) {
        alert('Por favor, informe a quantidade produzida antes de finalizar o serviço.');
        return;
      }
      
      if (timerAtivo) {
        clearInterval(timerAtivo);
        timerAtivo = null;
      }
      
      if (tempoInicio) {
        const tempoFinal = new Date();
        const tempoDecorrido = tempoFinal - tempoInicio;
        const horasDecorridas = tempoDecorrido / 3600000;
        
        registrosServicos.push({
          funcionario,
          servico: servicoAtual,
          inicio: tempoInicio.toLocaleString(),
          fim: tempoFinal.toLocaleString(),
          duracao: tempoDecorrido,
          horas: horasDecorridas,
          quantidade,
          eficiencia: horasDecorridas > 0 ? (quantidade / horasDecorridas).toFixed(2) : 0
        });
        
        salvarLocal();
        atualizarHistorico();
      }
      
      // Resetar tudo
      tempoInicio = null;
      servicoAtual = null;
      document.getElementById('timerDisplay').textContent = '00:00:00';
      document.getElementById('servicoAtualInfo').textContent = '';
      document.getElementById('quantidadeProduzida').value = '';
      document.getElementById('btnIniciarParar').textContent = 'Iniciar Serviço';
      document.getElementById('btnFinalizar').style.display = 'none';
      atualizarListaServicos();
    }

    function atualizarHistorico() {
      const historico = document.getElementById('historicoServicos');
      historico.innerHTML = registrosServicos.map(reg => `
        <div class="historico-item">
          <strong>${reg.funcionario}</strong> - ${reg.servico}<br>
          ${reg.inicio} até ${reg.fim}<br>
          Duração: ${(reg.duracao / 60000).toFixed(0)} minutos<br>
          Quantidade: ${reg.quantidade} | 
          Eficiência: ${reg.eficiencia}/hora
        </div>
      `).reverse().join('');
      
      // Atualizar filtros do relatório
      atualizarFiltrosRelatorio();
      gerarRelatorioServicos();
    }

    function atualizarFiltrosRelatorio() {
      // Atualizar filtro de funcionários
      const filtroFuncionario = document.getElementById('filtroFuncionarioHigh');
      if (filtroFuncionario) {
        const funcionarioAtual = filtroFuncionario.value;
        filtroFuncionario.innerHTML = `<option value="">Todos</option>` + 
          funcionarios.map(f => `<option value="${f}">${f}</option>`).join('');
        if (funcionarioAtual) filtroFuncionario.value = funcionarioAtual;
      }

      // Atualizar filtro de serviços
      const filtroServico = document.getElementById('filtroServicoHigh');
      if (filtroServico) {
        const servicoAtual = filtroServico.value;
        filtroServico.innerHTML = `<option value="">Todos</option>` + 
          servicos.map(s => `<option value="${s}">${s}</option>`).join('');
        if (servicoAtual) filtroServico.value = servicoAtual;
      }
    }

    function gerarRelatorioServicos() {
      const container = document.getElementById('relatorioServicosContainer');
      if (!container) return;

      // Aplicar filtros
      const filtroFuncionario = document.getElementById('filtroFuncionarioHigh')?.value || '';
      const filtroServico = document.getElementById('filtroServicoHigh')?.value || '';
      const filtroDataInicio = document.getElementById('filtroDataInicioHigh')?.value || '';
      const filtroDataFim = document.getElementById('filtroDataFimHigh')?.value || '';

      let registrosFiltrados = [...registrosServicos];

      if (filtroFuncionario) {
        registrosFiltrados = registrosFiltrados.filter(r => r.funcionario === filtroFuncionario);
      }

      if (filtroServico) {
        registrosFiltrados = registrosFiltrados.filter(r => r.servico === filtroServico);
      }

      if (filtroDataInicio) {
        const dataInicio = new Date(filtroDataInicio);
        registrosFiltrados = registrosFiltrados.filter(r => new Date(r.inicio) >= dataInicio);
      }

      if (filtroDataFim) {
        const dataFim = new Date(filtroDataFim);
        dataFim.setHours(23, 59, 59, 999); // Incluir todo o dia
        registrosFiltrados = registrosFiltrados.filter(r => new Date(r.fim) <= dataFim);
      }

      // Calcular estatísticas
      const totalRegistros = registrosFiltrados.length;
      const totalQuantidade = registrosFiltrados.reduce((sum, r) => sum + r.quantidade, 0);
      const totalHoras = registrosFiltrados.reduce((sum, r) => sum + r.horas, 0);
      const eficienciaMedia = totalHoras > 0 ? (totalQuantidade / totalHoras).toFixed(2) : 0;

      // Gerar HTML do relatório
      let html = `
        <div style="margin-bottom: 15px; padding: 10px; background-color: rgba(0,0,0,0.2); border-radius: 5px;">
          <strong>Resumo:</strong> ${totalRegistros} registros | 
          Total produzido: ${totalQuantidade} | 
          Total de horas: ${totalHoras.toFixed(2)}h | 
          Eficiência média: ${eficienciaMedia}/hora
        </div>
      `;

      if (registrosFiltrados.length === 0) {
        html += "<p>Nenhum registro encontrado com os filtros aplicados.</p>";
      } else {
        html += `
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr style="background-color: rgba(0,0,0,0.3);">
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Funcionário</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Serviço</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Início</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Fim</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Duração (min)</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Quantidade</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Eficiência/h</th>
            </tr>
        `;

        registrosFiltrados.forEach(reg => {
          html += `
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">${reg.funcionario}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">${reg.servico}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">${reg.inicio}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">${reg.fim}</td>
              <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${(reg.duracao / 60000).toFixed(0)}</td>
              <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${reg.quantidade}</td>
              <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${reg.eficiencia}</td>
            </tr>
          `;
        });

        html += "</table>";
      }

      container.innerHTML = html;
    }

    function exportarServicosExcel() {
      // Aplicar os mesmos filtros do relatório
      const filtroFuncionario = document.getElementById('filtroFuncionarioHigh')?.value || '';
      const filtroServico = document.getElementById('filtroServicoHigh')?.value || '';
      const filtroDataInicio = document.getElementById('filtroDataInicioHigh')?.value || '';
      const filtroDataFim = document.getElementById('filtroDataFimHigh')?.value || '';

      let registrosFiltrados = [...registrosServicos];

      if (filtroFuncionario) {
        registrosFiltrados = registrosFiltrados.filter(r => r.funcionario === filtroFuncionario);
      }

      if (filtroServico) {
        registrosFiltrados = registrosFiltrados.filter(r => r.servico === filtroServico);
      }

      if (filtroDataInicio) {
        const dataInicio = new Date(filtroDataInicio);
        registrosFiltrados = registrosFiltrados.filter(r => new Date(r.inicio) >= dataInicio);
      }

      if (filtroDataFim) {
        const dataFim = new Date(filtroDataFim);
        dataFim.setHours(23, 59, 59, 999);
        registrosFiltrados = registrosFiltrados.filter(r => new Date(r.fim) <= dataFim);
      }

      if (registrosFiltrados.length === 0) {
        alert("Nenhum registro para exportar com os filtros aplicados.");
        return;
      }

      // Criar conteúdo CSV
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Funcionário,Serviço,Início,Fim,Duração (minutos),Quantidade,Eficiência por hora\\n";
      
      registrosFiltrados.forEach(reg => {
        const duracao = (reg.duracao / 60000).toFixed(0);
        csvContent += `"${reg.funcionario}","${reg.servico}","${reg.inicio}","${reg.fim}","${duracao}","${reg.quantidade}","${reg.eficiencia}"\\n`;
      });

      // Criar e baixar arquivo
      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = `relatorio_servicos_klz_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`Relatório exportado com ${registrosFiltrados.length} registros!`);
    }

    function limparFiltrosHigh() {
      document.getElementById('filtroFuncionarioHigh').value = '';
      document.getElementById('filtroServicoHigh').value = '';
      document.getElementById('filtroDataInicioHigh').value = '';
      document.getElementById('filtroDataFimHigh').value = '';
      gerarRelatorioServicos();
    }

    window.onload = function () {
      carregarLocal();
      mostrarTela('login');
    }