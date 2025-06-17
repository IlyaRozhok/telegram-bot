export const handleMainMenu = async (ctx: BotContext) => {
  // Очищаем все поля сессии
  delete ctx.session.addCategory;
  delete ctx.session.totalCost;
  delete ctx.session.installmentAmount;
  delete ctx.session.startMonth;
  delete ctx.session.startYear;
  delete ctx.session.finalMonth;
  delete ctx.session.finalYear;
  delete ctx.session.installmentComment;
  delete ctx.session.cardDebt;
  delete ctx.session.otherDebt;
  delete ctx.session.editingInstallmentId;
  delete ctx.session.editingInstallmentField;
  delete ctx.session.editingStartMonth;
  delete ctx.session.editingFinalMonth;

  return ctx.reply("👋 Welcome to FinFix!\n\nWhat would you like to do?", {
    parse_mode: "Markdown",
    ...Markup.keyboard([
      [MainButtons.NewDebt, MainButtons.Explore],
      [MainButtons.Profile],
    ])
      .resize()
      .oneTime(),
  });
};
