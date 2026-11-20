package br.com.unifood.produtos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record ProdutoRequest(
        @NotBlank String nome,
        String descricao,
        @Positive double preco,
        @NotBlank String bloco,
        String imagemUrl,
        Boolean disponivel) {}
